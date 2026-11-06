#!/usr/bin/python3
from pathlib import Path
from gi.repository import Gio, GLib
import json, subprocess, time
p=Path.home()/'.local/share/gnome-shell/extensions/blur-my-shell@aunetx/stylesheet.css'
s=p.read_text();start=s.index('/* BEGIN LOCKSCREEN GLASS */');end=s.index('/* END LOCKSCREEN GLASS */')+len('/* END LOCKSCREEN GLASS */')
p.write_text(s[:start]+s[end:])
src=Gio.SettingsSchemaSource.new_from_directory(str(p.parent/'schemas'),Gio.SettingsSchemaSource.get_default(),False)
settings=Gio.Settings.new_full(src.lookup('org.gnome.shell.extensions.blur-my-shell.lockscreen',False),None,None)
for k,v in json.loads((Path(__file__).parent/'settings-before.json').read_text()).items():
    settings.set_value(k,GLib.Variant.parse(None,v,None,None))
Gio.Settings.sync()
subprocess.run(['gnome-extensions','disable','blur-my-shell@aunetx'],check=True)
time.sleep(2)
subprocess.run(['gnome-extensions','enable','blur-my-shell@aunetx'],check=True)
print('Previous lock-screen appearance restored.')
