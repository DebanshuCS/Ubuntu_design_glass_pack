import {Extension, InjectionManager} from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import {WorkspaceBackground} from 'resource:///org/gnome/shell/ui/workspace.js';
import {ControlsManager} from 'resource:///org/gnome/shell/ui/overviewControls.js';

// Scope the speed override to synchronous overview entry/exit scheduling.
// Preserve GNOME's callbacks, easing curves, and every other animation.
export function runOverviewTransition(controls, original, args) {
    const adjustment = controls._stateAdjustment;
    const descriptor = Object.getOwnPropertyDescriptor(adjustment, 'ease');
    const ease = adjustment.ease;
    adjustment.ease = function (value, options) {
        return ease.call(this, value, {...options,
            duration: Math.min(options.duration ?? 180, 180)});
    };
    try {
        return original.apply(controls, args);
    } finally {
        if (descriptor)
            Object.defineProperty(adjustment, 'ease', descriptor);
        else
            delete adjustment.ease;
    }
}

export default class OverviewGlass extends Extension {
    enable() {
        this._backgrounds = new Map();
        this._injections = new InjectionManager();
        const extension = this;
        this._injections.overrideMethod(WorkspaceBackground.prototype, '_init',
            original => function (...args) {
                original.apply(this, args);
                extension._hideBackdrop(this);
            });
        for (const method of ['animateToOverview', 'animateFromOverview']) {
            this._injections.overrideMethod(ControlsManager.prototype, method,
                original => function (...args) {
                    return runOverviewTransition(this, original, args);
                });
        }
        this._scan(Main.layoutManager.overviewGroup);
        this._showingId = Main.overview.connect('showing', () =>
            this._scan(Main.layoutManager.overviewGroup));
    }

    _hideBackdrop(actor) {
        if (this._backgrounds.has(actor))
            return;
        const opacity = actor.opacity;
        const destroyId = actor.connect('destroy', () => this._backgrounds.delete(actor));
        this._backgrounds.set(actor, {opacity, destroyId});
        // The background is a sibling of window previews, not their parent.
        // Keep its allocation so GNOME's window placement remains unchanged.
        actor.opacity = 0;
    }

    _scan(actor) {
        if (actor instanceof WorkspaceBackground)
            this._hideBackdrop(actor);
        for (const child of actor.get_children())
            this._scan(child);
    }

    disable() {
        if (this._showingId)
            Main.overview.disconnect(this._showingId);
        this._showingId = 0;
        this._injections?.clear();
        this._injections = null;
        for (const [actor, {opacity, destroyId}] of this._backgrounds ?? []) {
            actor.disconnect(destroyId);
            actor.opacity = opacity;
        }
        this._backgrounds?.clear();
    }
}
