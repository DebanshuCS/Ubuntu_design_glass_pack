#!/usr/bin/python3
from pathlib import Path
import json
from gi.repository import Gio
base=Path('/home/user/overview-card-fix'); before=json.loads((base/'before.json').read_text())
shell=Gio.Settings.new('org.gnome.shell'); enabled=[u for u in shell.get_strv('enabled-extensions') if u!='overview-card-glass@local']
if 'overview-glass@local' in before['enabled'] and 'overview-glass@local' not in enabled: enabled.append('overview-glass@local')
shell.set_strv('enabled-extensions',enabled)
source=Gio.SettingsSchemaSource.new_from_directory('/home/user/.local/share/gnome-shell/extensions/blur-my-shell@aunetx/schemas',Gio.SettingsSchemaSource.get_default(),False)
s=Gio.Settings.new_full(source.lookup('org.gnome.shell.extensions.blur-my-shell.overview',False),None,None)
s.set_string('pipeline',before['overview-pipeline']); Gio.Settings.sync()
print('Previous overview pipeline and companion selection restored. Unused clear-wallpaper preset retained.')
