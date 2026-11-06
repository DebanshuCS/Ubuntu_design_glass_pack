#!/usr/bin/python3
from pathlib import Path
import json, shutil, subprocess, time
from gi.repository import Gio, GLib
root = Path(__file__).parent
backup = Path((root / 'latest-path').read_text().strip())
state = json.loads((backup / 'settings-before.json').read_text())
ext = Path.home() / '.local/share/gnome-shell/extensions/blur-my-shell@aunetx'
shutil.copy2(backup / 'gtk.css', Path.home() / '.config/gtk-4.0/gtk.css')
shutil.copy2(backup / 'stylesheet.css', ext / 'stylesheet.css')
source = Gio.SettingsSchemaSource.new_from_directory(str(ext / 'schemas'), Gio.SettingsSchemaSource.get_default(), False)
for suffix in ('.popup', '.overview'):
    settings = Gio.Settings.new_full(source.lookup('org.gnome.shell.extensions.blur-my-shell' + suffix, False), None, None)
    for key, value in state[suffix].items():
        settings.set_value(key, GLib.Variant.parse(None, value, None, None))
shell = Gio.Settings.new('org.gnome.shell')
managed = {'overview-card-glass@local', 'overview-glass@local', 'overview-layout@local'}
enabled = [item for item in shell.get_strv('enabled-extensions') if item not in managed]
enabled += [item for item in state['enabled'] if item in managed]
shell.set_strv('enabled-extensions', enabled)
Gio.Settings.sync()
time.sleep(2)
subprocess.run(['gnome-extensions', 'disable', 'blur-my-shell@aunetx'], check=True)
time.sleep(2)
subprocess.run(['gnome-extensions', 'enable', 'blur-my-shell@aunetx'], check=True)
print('Restored previous appearance. Reopen GTK applications; companion extension changes may need a new login.')
