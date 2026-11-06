#!/usr/bin/python3
from pathlib import Path
from gi.repository import Gio,GLib
import json,shutil,subprocess,time
base=Path(__file__).parent;b=Path((base/'latest').read_text());data=json.loads((b/'settings.json').read_text());root=Path.home()/'.local/share/gnome-shell/extensions'
for version,name in [('3.0','gtk3.css'),('4.0','gtk4.css')]:shutil.copy2(b/name,Path.home()/'.config'/('gtk-'+version)/'gtk.css')
shutil.copy2(b/'shell.css',root/'blur-my-shell@aunetx/stylesheet.css')
def restore(uuid,schema,values):
 src=Gio.SettingsSchemaSource.new_from_directory(str(root/uuid/'schemas'),Gio.SettingsSchemaSource.get_default(),False)
 s=Gio.Settings.new_full(src.lookup(schema,False),None,None)
 for k,v in values.items():s.set_value(k,GLib.Variant.parse(None,v,None,None))
restore('rounded-window-corners@fxgn','org.gnome.shell.extensions.rounded-window-corners-reborn',{'global-rounded-corner-settings':data['corners']})
for suffix,values in data['blur'].items():restore('blur-my-shell@aunetx','org.gnome.shell.extensions.blur-my-shell.'+suffix,values)
Gio.Settings.sync()
subprocess.run(['gnome-extensions','disable','blur-my-shell@aunetx'],check=True);time.sleep(2)
subprocess.run(['gnome-extensions','enable','blur-my-shell@aunetx'],check=True)
print('Previous appearance restored. Reopen GTK apps.')
