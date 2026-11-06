import {Extension, InjectionManager} from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import {WorkspaceBackground} from 'resource:///org/gnome/shell/ui/workspace.js';
import {ControlsManager} from 'resource:///org/gnome/shell/ui/overviewControls.js';
import St from 'gi://St';
import Blur from 'gi://Blur';
import GLib from 'gi://GLib';

export function shouldBlurCard(shown, moving, state) {
    // All workspace cards qualify, including empty and inactive workspaces.
    // Only the global Overview transition decides when blur may appear.
    return shown && !moving && state >= 1;
}

export function runOverviewTransition(controls, original, args) {
    const adjustment = controls._stateAdjustment;
    const descriptor = Object.getOwnPropertyDescriptor(adjustment, 'ease');
    const ease = adjustment.ease;
    adjustment.ease = function (value, options) {
        return ease.call(this, value, {...options,
            duration: Math.min(options.duration ?? 180, 180)});
    };
    try { return original.apply(controls, args); }
    finally {
        if (descriptor) Object.defineProperty(adjustment, 'ease', descriptor);
        else delete adjustment.ease;
    }
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
        for (const method of ['animateToOverview', 'animateFromOverview'])
            this._injections.overrideMethod(ControlsManager.prototype, method,
                original => function (...args) {
                    return runOverviewTransition(this, original, args);
                });
        this._scan(Main.layoutManager.overviewGroup);
        this._overviewIds = ['showing', 'shown', 'hiding', 'hidden'].map(signal =>
            Main.overview.connect(signal, () => {
                this._settled = signal === 'shown';
                if (signal === 'showing') this._scan(Main.layoutManager.overviewGroup);
                this._refreshCards();
            }));
        this._watchTransition();
    }

    _attachCard(card) {
        if (this._cards.has(card)) return;
        // _bin contains only the workspace wallpaper. Window previews are
        // siblings of WorkspaceBackground, so they never enter this effect.
        const actor = card._bin;
        const effect = new Blur.BlurEffect({mode: Blur.BlurMode.ACTOR,
            radius: 0, brightness: 1, corner_radius: 0});
        const context = St.ThemeContext.get_for_stage(global.stage);
        const update = () => {
            const state = this._overviewAdjustment.getStateTransitionParams();
            const enabled = shouldBlurCard(this._settled,
                Main.overview.animationInProgress || state.transitioning,
                state.currentState);
            // No blur or dimming during motion. Enable only the wallpaper
            // effect after Overview and the workspace layout have settled.
            effect.radius = 30 * context.scale_factor;
            effect.brightness = 0.85;
            effect.corner_radius = 30 * context.scale_factor;
            effect.enabled = enabled;
        };
        actor.add_effect(effect);
        const adjustmentId = card._stateAdjustment.connect('notify::value', update);
        const scaleId = context.connect('notify::scale-factor', update);
        const destroyId = card.connect('destroy', () => this._detachCard(card, true));
        this._cards.set(card, {actor, effect, context, adjustmentId, scaleId, destroyId, update});
        update();
    }

    _detachCard(card, destroying = false) {
        const record = this._cards.get(card);
        if (!record) return;
        this._cards.delete(card);
        card._stateAdjustment.disconnect(record.adjustmentId);
        record.context.disconnect(record.scaleId);
        if (!destroying) {
            card.disconnect(record.destroyId);
            record.actor.remove_effect(record.effect);
        }
    }

    _refreshCards() {
        for (const {update} of this._cards.values()) update();
    }

    _watchTransition() {
        const transition = this._overviewAdjustment.get_transition('value');
        if (!transition || this._transitionIds.has(transition)) return;
        const id = transition.connect('stopped', () => {
            transition.disconnect(this._transitionIds.get(transition));
            this._transitionIds.delete(transition);
            // Let GNOME remove its finished transition before checking state.
            if (!this._refreshId) this._refreshId = GLib.idle_add(GLib.PRIORITY_DEFAULT_IDLE, () => {
                this._refreshId = 0;
                this._refreshCards();
                return GLib.SOURCE_REMOVE;
            });
        });
        this._transitionIds.set(transition, id);
    }

    _scan(actor) {
        if (actor instanceof WorkspaceBackground) this._attachCard(actor);
        for (const child of actor.get_children()) this._scan(child);
    }

    disable() {
        for (const id of this._overviewIds ?? []) Main.overview.disconnect(id);
        this._overviewIds = [];
        this._overviewAdjustment.disconnect(this._valueId);
        if (this._refreshId) GLib.Source.remove(this._refreshId);
        this._refreshId = 0;
        for (const [transition, id] of this._transitionIds) transition.disconnect(id);
        this._transitionIds.clear();
        this._injections?.clear();
        for (const card of this._cards.keys()) this._detachCard(card);
        this._injections = null;
    }
}
