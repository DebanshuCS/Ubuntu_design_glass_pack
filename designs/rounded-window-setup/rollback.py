#!/usr/bin/python3
from pathlib import Path
from gi.repository import Gio,GLib
import json,shutil
base=Path(__file__).parent;b=Path((base/'latest-backup').read_text());old=json.loads((b/'settings.json').read_text())
for v in ['3.0','4.0']:shutil.copy2(b/('gtk'+v+'.css'),Path.home()/'.config'/('gtk-'+v)/'gtk.css')
root=Path.home()/'.local/share/gnome-shell/extensions'
for uuid,schema,values in [('rounded-window-corners@fxgn','org.gnome.shell.extensions.rounded-window-corners-reborn',old['corners'])]+[('blur-my-shell@aunetx','org.gnome.shell.extensions.blur-my-shell.'+suffix,values) for suffix,values in old['blur'].items()]:
 src=Gio.SettingsSchemaSource.new_from_directory(str(root/uuid/'schemas'),Gio.SettingsSchemaSource.get_default(),False)
 s=Gio.Settings.new_full(src.lookup(schema,False),None,None)
 for k,v in values.items():s.set_value(k,GLib.Variant.parse(None,v,None,None))
s=Gio.Settings.new('org.gnome.shell');enabled=s.get_strv('enabled-extensions')
if 'rounded-window-corners@fxgn' not in old['enabled']:s.set_strv('enabled-extensions',[x for x in enabled if x!='rounded-window-corners@fxgn'])
Gio.Settings.sync();print('Previous corner settings restored. Reopen GTK apps.')
