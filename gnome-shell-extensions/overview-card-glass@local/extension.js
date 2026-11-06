import {Extension, InjectionManager} from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import {WorkspaceBackground} from 'resource:///org/gnome/shell/ui/workspace.js';
import St from 'gi://St';
import Blur from 'gi://Blur';
import GLib from 'gi://GLib';
import Clutter from 'gi://Clutter';

export const CARD_BLUR_MS = 280;

export function shouldBlurCard(shown, moving, state) {
    return shown && !moving && state >= 1;
}

export function wallpaperCloneOpacity() {
    return 0;
}

export function dockBottomReserve(uiGroup) {
    let height = 0;
    for (const actor of uiGroup.get_children()) {
        if (actor.name === 'dashtodockContainer' && actor.visible)
            height = Math.max(height, actor.height);
    }
    return height;
}

export function createBlurRamp(makeTimeline, paint) {
    let timeline = null;
    let target = false;
    let amount = 0;
    const stop = () => {
        const old = timeline;
        timeline = null;
        old?.stop();
    };
    return {
        setTarget(enabled, animate = true) {
            if (!enabled) {
                target = false;
                stop();
                amount = 0;
                paint(0);
                return;
            }
            if (target) {
                paint(amount);
                return;
            }
            target = true;
            if (!animate) {
                amount = 1;
                paint(1);
                return;
            }
            amount = 0;
            paint(0);
            const running = makeTimeline(CARD_BLUR_MS);
            timeline = running;
            running.connect('new-frame', () => {
                if (timeline !== running)
                    return;
                const t = Math.max(0, Math.min(1, running.get_progress()));
                amount = t * t * (3 - 2 * t);
                paint(amount);
            });
            running.connect('completed', () => {
                if (timeline !== running)
                    return;
                timeline = null;
                amount = 1;
                paint(1);
            });
            running.start();
        },
        destroy() {
            target = false;
            stop();
        },
    };
}

export default class OverviewGlass extends Extension {
    enable() {
        this._cards = new Map();
        this._settled = Main.overview.visible && !Main.overview.animationInProgress;
        this._transitionIds = new Map();
        this._refreshId = 0;
        this._overviewAdjustment = Main.overview._overview._controls._stateAdjustment;
        this._valueId = this._overviewAdjustment.connect('notify::value', () => {
            this._watchTransition();
            this._refreshCards();
        });
        this._injections = new InjectionManager();
        const extension = this;
        this._injections.overrideMethod(WorkspaceBackground.prototype, '_init',
            original => function (...args) {
                original.apply(this, args);
                extension._attachCard(this);
            });
        this._scan(Main.layoutManager.overviewGroup);
        this._overviewIds = ['showing', 'shown', 'hiding', 'hidden'].map(signal =>
            Main.overview.connect(signal, () => {
                this._settled = signal === 'shown';
                if (signal === 'showing')
                    this._scan(Main.layoutManager.overviewGroup);
                this._refreshCards();
            }));
        this._watchTransition();
    }

    _attachCard(card) {
        if (this._cards.has(card))
            return;
        const wallpaper = card._bin;
        const wallpaperOpacity = wallpaper.opacity;
        wallpaper.opacity = wallpaperCloneOpacity();
        const cardStyle = card.get_style();
        card.set_style('box-shadow: none; border: none; border-radius: 0; background-color: transparent;');

        const context = St.ThemeContext.get_for_stage(global.stage);
        const effect = new Blur.BlurEffect({
            mode: Blur.BlurMode.ACTOR,
            radius: 0,
            brightness: 1,
            corner_radius: 0,
        });
        wallpaper.add_effect(effect);

        const clipWallpaper = () => this._clipAboveDock(wallpaper);
        const allocId = wallpaper.connect('notify::allocation', clipWallpaper);
        clipWallpaper();

        const ramp = createBlurRamp(
            duration => new Clutter.Timeline({duration, actor: wallpaper}),
            amount => {
                effect.radius = 36 * context.scale_factor * amount;
                effect.brightness = 1 - 0.12 * amount;
                effect.enabled = amount > 0;
                wallpaper.opacity = Math.round(255 * amount);
            });
        const update = () => {
            const state = this._overviewAdjustment.getStateTransitionParams();
            const enabled = shouldBlurCard(this._settled,
                Main.overview.animationInProgress || state.transitioning,
                state.currentState);
            ramp.setTarget(enabled, St.Settings.get().enable_animations);
        };
        const adjustmentId = card._stateAdjustment.connect('notify::value', update);
        const scaleId = context.connect('notify::scale-factor', update);
        const destroyId = card.connect('destroy', () => this._detachCard(card, true));
        this._cards.set(card, {
            wallpaper, wallpaperOpacity, effect, context, cardStyle,
            adjustmentId, scaleId, destroyId, allocId, update, ramp,
        });
        update();
    }

    _detachCard(card, destroying = false) {
        const record = this._cards.get(card);
        if (!record)
            return;
        this._cards.delete(card);
        record.ramp.destroy();
        card._stateAdjustment.disconnect(record.adjustmentId);
        record.context.disconnect(record.scaleId);
        record.wallpaper.disconnect(record.allocId);
        if (!destroying) {
            card.disconnect(record.destroyId);
            record.wallpaper.remove_effect(record.effect);
            record.wallpaper.opacity = record.wallpaperOpacity;
            record.wallpaper.remove_clip();
            card.set_style(record.cardStyle);
        }
    }

    _refreshCards() {
        for (const {update} of this._cards.values())
            update();
    }

    _watchTransition() {
        const transition = this._overviewAdjustment.get_transition('value');
        if (!transition || this._transitionIds.has(transition))
            return;
        const id = transition.connect('stopped', () => {
            transition.disconnect(this._transitionIds.get(transition));
            this._transitionIds.delete(transition);
            if (!this._refreshId)
                this._refreshId = GLib.idle_add(GLib.PRIORITY_DEFAULT_IDLE, () => {
                    this._refreshId = 0;
                    this._refreshCards();
                    return GLib.SOURCE_REMOVE;
                });
        });
        this._transitionIds.set(transition, id);
    }

    _scan(actor) {
        if (actor instanceof WorkspaceBackground)
            this._attachCard(actor);
        for (const child of actor.get_children())
            this._scan(child);
    }

    _clipAboveDock(actor) {
        const reserve = dockBottomReserve(Main.uiGroup);
        const width = actor.width;
        const height = actor.height;
        if (height > reserve)
            actor.set_clip(0, 0, width, height - reserve);
        else
            actor.remove_clip();
    }

    disable() {
        for (const id of this._overviewIds ?? [])
            Main.overview.disconnect(id);
        this._overviewIds = [];
        this._overviewAdjustment.disconnect(this._valueId);
        if (this._refreshId)
            GLib.Source.remove(this._refreshId);
        this._refreshId = 0;
        for (const [transition, id] of this._transitionIds)
            transition.disconnect(id);
        this._transitionIds.clear();
        this._injections?.clear();
        for (const card of this._cards.keys())
            this._detachCard(card);
        this._injections = null;
    }
}
