import {Extension, InjectionManager} from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import {WorkspaceBackground} from 'resource:///org/gnome/shell/ui/workspace.js';
import {ControlsManager} from 'resource:///org/gnome/shell/ui/overviewControls.js';
import St from 'gi://St';
import Blur from 'gi://Blur';

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
        this._showingId = Main.overview.connect('showing', () =>
            this._scan(Main.layoutManager.overviewGroup));
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
            const progress = Math.max(0, Math.min(1, card._stateAdjustment.value));
            effect.radius = 30 * context.scale_factor * progress;
            effect.brightness = 1 - 0.15 * progress;
            effect.corner_radius = 30 * context.scale_factor * progress;
            effect.enabled = progress > 0;
        };
        actor.add_effect(effect);
        const adjustmentId = card._stateAdjustment.connect('notify::value', update);
        const scaleId = context.connect('notify::scale-factor', update);
        const destroyId = card.connect('destroy', () => this._detachCard(card, true));
        this._cards.set(card, {actor, effect, context, adjustmentId, scaleId, destroyId});
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

    _scan(actor) {
        if (actor instanceof WorkspaceBackground) this._attachCard(actor);
        for (const child of actor.get_children()) this._scan(child);
    }

    disable() {
        if (this._showingId) Main.overview.disconnect(this._showingId);
        this._showingId = 0;
        this._injections?.clear();
        for (const card of this._cards.keys()) this._detachCard(card);
        this._injections = null;
    }
}
