#!/usr/bin/python3
from pathlib import Path
import json
from gi.repository import Gio,GLib
base=Path('/home/user/desktop-glass-redesign'); backup=Path((base/'latest-path').read_text()); css=Path('/home/user/.config/gtk-4.0/gtk.css')
if css.read_text()!=(backup/'applied-css').read_text():
    raise SystemExit('GTK CSS has changed since installation; preserve those edits before restoring the backup.')
if (backup/'css-existed').read_text()=='True': css.write_bytes((backup/'gtk.css').read_bytes())
else: css.unlink()
source=Gio.SettingsSchemaSource.new_from_directory('/home/user/.local/share/gnome-shell/extensions/blur-my-shell@aunetx/schemas',Gio.SettingsSchemaSource.get_default(),False)
s=Gio.Settings.new_full(source.lookup('org.gnome.shell.extensions.blur-my-shell.applications',False),None,None)
s.delay()
for k,v in json.loads((backup/'settings.json').read_text()).items(): s.set_value(k,GLib.Variant.parse(None,v,None,None))
s.apply()
if (backup/'companion-was-enabled').read_text()=='False':
    shell=Gio.Settings.new('org.gnome.shell'); shell.set_strv('enabled-extensions',[u for u in shell.get_strv('enabled-extensions') if u!='overview-glass@local'])
Gio.Settings.sync()
print('Previous application styling and blur restored. Reopen GTK apps to refresh their styles.')
