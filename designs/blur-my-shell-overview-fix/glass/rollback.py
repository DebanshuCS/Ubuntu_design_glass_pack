#!/usr/bin/python3
from pathlib import Path
import json
from gi.repository import Gio
shell=Gio.Settings.new('org.gnome.shell')
shell.set_strv('enabled-extensions',[u for u in shell.get_strv('enabled-extensions') if u!='overview-glass@local'])
source=Gio.SettingsSchemaSource.new_from_directory('/home/user/.local/share/gnome-shell/extensions/blur-my-shell@aunetx/schemas',Gio.SettingsSchemaSource.get_default(),False)
backup=json.loads(Path('/home/user/blur-my-shell-overview-fix/glass/unblur-before.json').read_text())
for component,value in backup.items():
    s=Gio.Settings.new_full(source.lookup('org.gnome.shell.extensions.blur-my-shell.'+component,False),None,None)
    s.set_boolean('unblur-in-overview',value)
Gio.Settings.sync()
print('Companion disabled; previous dock/panel overview behavior restored.')
