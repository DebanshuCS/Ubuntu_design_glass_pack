import {Extension, InjectionManager} from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import {ControlsManager} from 'resource:///org/gnome/shell/ui/overviewControls.js';

export default class OverviewLayout extends Extension {
    enable() {
        this._docks = new Map();
        this._injections = new InjectionManager();
        for (const method of ['animateToOverview', 'animateFromOverview'])
            this._injections.overrideMethod(ControlsManager.prototype, method,
                original => function (...args) {
                    const adjustment = this._stateAdjustment;
                    const descriptor = Object.getOwnPropertyDescriptor(adjustment, 'ease');
                    const ease = adjustment.ease;
                    adjustment.ease = function (value, options) {
                        return ease.call(this, value, {...options,
                            duration: Math.min(options.duration ?? 180, 180)});
                    };
                    try { return original.apply(this, args); }
                    finally {
                        if (descriptor) Object.defineProperty(adjustment, 'ease', descriptor);
                        else delete adjustment.ease;
                    }
                });
        this._showId = Main.overview.connect('showing', () => this._pinDocks());
        this._shownId = Main.overview.connect('shown', () => this._pinDocks());
        this._hideId = Main.overview.connect('hiding', () => this._pinDocks());
        this._hiddenId = Main.overview.connect('hidden', () => this._pinDocks());
        this._childId = Main.uiGroup.connect('child-added', () => this._pinDocks());
        this._pinDocks();
    }

    _pinDocks() {
        const overview = Main.layoutManager.overviewGroup;
        for (const actor of Main.uiGroup.get_children()) {
            if (actor.name !== 'dashtodockContainer')
                continue;
            if (!this._docks.has(actor)) {
                const visibleId = actor.connect('notify::visible', () => {
                    if (!actor.visible)
                        actor.show();
                });
                const destroyId = actor.connect('destroy', () => this._docks.delete(actor));
                this._docks.set(actor, {visibleId, destroyId});
            }
            actor.show();
            actor.opacity = 255;
            if (overview && actor.get_parent() === Main.uiGroup)
                Main.uiGroup.set_child_above_sibling(actor, overview);
        }
    }

    disable() {
        Main.overview.disconnect(this._showId);
        Main.overview.disconnect(this._shownId);
        Main.overview.disconnect(this._hideId);
        Main.overview.disconnect(this._hiddenId);
        Main.uiGroup.disconnect(this._childId);
        for (const [actor, {visibleId, destroyId}] of this._docks) {
            actor.disconnect(visibleId);
            actor.disconnect(destroyId);
        }
        this._docks.clear();
        this._injections.clear();
    }
}
