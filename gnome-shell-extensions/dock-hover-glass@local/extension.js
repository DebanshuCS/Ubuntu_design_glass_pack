import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import Clutter from 'gi://Clutter';
import GLib from 'gi://GLib';
import St from 'gi://St';

export default class DockHoverGlass extends Extension {
    enable() {
        this._actors = new Map();
        this._idle = 0;
        this._rootId = Main.uiGroup.connect('child-added', () => this._queue());
        this._scan();
    }
    _queue() {
        if (this._idle) return;
        this._idle = GLib.idle_add(GLib.PRIORITY_DEFAULT_IDLE, () => {
            this._idle = 0;
            this._scan();
            return GLib.SOURCE_REMOVE;
        });
    }
    _scan() {
        for (const dock of Main.uiGroup.get_children())
            if (dock.name === 'dashtodockContainer') this._walk(dock);
    }
    _walk(actor) {
        let record = this._actors.get(actor);
        if (!record) {
            record = {ids: [], icon: null};
            this._actors.set(actor, record);
            record.ids.push(actor.connect('child-added', () => this._queue()));
            record.ids.push(actor.connect('destroy', () => this._actors.delete(actor)));
        }
        const icon = actor.icon?._iconBin;
        if (!record.icon && icon && typeof actor.hover === 'boolean') {
            record.icon = icon;
            record.pivot = icon.get_pivot_point();
            record.sx = icon.scale_x;
            record.sy = icon.scale_y;
            icon.set_pivot_point(0.5, 0.5);
            const update = () => {
                const factor = actor.hover ? 1.14 : 1;
                icon.ease({scale_x: record.sx * factor, scale_y: record.sy * factor,
                    duration: St.Settings.get().enable_animations ? 160 : 0,
                    mode: Clutter.AnimationMode.EASE_OUT_QUAD});
            };
            record.ids.push(actor.connect('notify::hover', update));
            update();
        }
        for (const child of actor.get_children()) this._walk(child);
    }
    disable() {
        Main.uiGroup.disconnect(this._rootId);
        if (this._idle) GLib.Source.remove(this._idle);
        this._idle = 0;
        for (const [actor, record] of this._actors) {
            for (const id of record.ids) actor.disconnect(id);
            if (record.icon) {
                record.icon.remove_transition('scale-x');
                record.icon.remove_transition('scale-y');
                record.icon.scale_x = record.sx;
                record.icon.scale_y = record.sy;
                record.icon.set_pivot_point(...record.pivot);
            }
        }
        this._actors.clear();
    }
}
