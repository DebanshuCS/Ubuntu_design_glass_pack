#!/usr/bin/python3
import json,shutil
from pathlib import Path
from gi.repository import Gio
base=Path('/home/user/glass-readability-fix')
shutil.copy2(base/'gtk-before.css','/home/user/.config/gtk-4.0/gtk.css')
source=Gio.SettingsSchemaSource.new_from_directory('/home/user/.local/share/gnome-shell/extensions/blur-my-shell@aunetx/schemas',Gio.SettingsSchemaSource.get_default(),False)
s=Gio.Settings.new_full(source.lookup('org.gnome.shell.extensions.blur-my-shell.applications',False),None,None)
s.set_strv('whitelist',json.loads((base/'whitelist-before.json').read_text())); Gio.Settings.sync()
print('Previous styling restored. Reopen GTK apps.')
