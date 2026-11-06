#!/usr/bin/python3
from pathlib import Path
import json, shutil, subprocess, time
from gi.repository import Gio, GLib
base=Path(__file__).parent;b=Path((base/'latest').read_text())
shutil.copy2(b/'gtk4.css',Path.home()/'.config/gtk-4.0/gtk.css')
ext=Path.home()/'.local/share/gnome-shell/extensions/blur-my-shell@aunetx'
shutil.copy2(b/'shell.css',ext/'stylesheet.css')
src=Gio.SettingsSchemaSource.new_from_directory(str(ext/'schemas'),Gio.SettingsSchemaSource.get_default(),False)
old=json.loads((b/'settings.json').read_text())
for schema,values in old.items():
 if schema=='enabled':continue
 s=Gio.Settings.new_full(src.lookup(schema,True),None,None)
 for k,v in values.items():s.set_value(k,GLib.Variant.parse(None,v,None,None))
shell=Gio.Settings.new('org.gnome.shell')
v=shell.get_strv('enabled-extensions')
if 'dock-hover-glass@local' not in old['enabled']:
 shell.set_strv('enabled-extensions',[x for x in v if x!='dock-hover-glass@local'])
Gio.Settings.sync()
time.sleep(2)
subprocess.run(['gnome-extensions','disable','blur-my-shell@aunetx'],check=True)
time.sleep(2)
subprocess.run(['gnome-extensions','enable','blur-my-shell@aunetx'],check=True)
print('Restored appearance from this change’s backup. Reopen GTK applications.')
