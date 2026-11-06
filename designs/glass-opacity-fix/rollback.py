#!/usr/bin/python3
from pathlib import Path
import json,shutil,subprocess
from gi.repository import Gio,GLib
backup=Path(Path('/home/user/glass-opacity-fix/latest-path').read_text())
shutil.copy2(backup/'gtk.css','/home/user/.config/gtk-4.0/gtk.css')
shutil.copy2(backup/'stylesheet.css','/home/user/.local/share/gnome-shell/extensions/blur-my-shell@aunetx/stylesheet.css')
source=Gio.SettingsSchemaSource.new_from_directory('/home/user/.local/share/gnome-shell/extensions/blur-my-shell@aunetx/schemas',Gio.SettingsSchemaSource.get_default(),False)
s=Gio.Settings.new_full(source.lookup('org.gnome.shell.extensions.blur-my-shell.appfolder',False),None,None)
s.delay()
for k,v in json.loads((backup/'appfolder.json').read_text()).items(): s.set_value(k,GLib.Variant.parse(None,v,None,None))
s.apply(); Gio.Settings.sync()
try: subprocess.run(['gnome-extensions','disable','blur-my-shell@aunetx'],check=True)
finally: subprocess.run(['gnome-extensions','enable','blur-my-shell@aunetx'],check=True)
print('Previous opacity restored. Reopen GTK apps to refresh styling.')
