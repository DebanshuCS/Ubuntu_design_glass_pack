from gi.repository import Gio,GLib
from pathlib import Path
import subprocess,json
base=Path('/home/user/overview-card-fix')
source=Gio.SettingsSchemaSource.new_from_directory('/home/user/.local/share/gnome-shell/extensions/blur-my-shell@aunetx/schemas',Gio.SettingsSchemaSource.get_default(),False)
def s(suffix): return Gio.Settings.new_full(source.lookup('org.gnome.shell.extensions.blur-my-shell'+suffix,False),None,None)
main=s(''); overview=s('.overview'); shell=Gio.Settings.new('org.gnome.shell')
(base/'settings-before.dconf').write_bytes(subprocess.check_output(['dconf','dump','/org/gnome/shell/extensions/blur-my-shell/']))
(base/'before.json').write_text(json.dumps({'overview-pipeline':overview.get_string('pipeline'),'enabled':shell.get_strv('enabled-extensions')}))
# Disable the loaded version that hides workspace backgrounds now.
subprocess.run(['gnome-extensions','disable','overview-glass@local'],check=True)
key='pipeline_overview_clear_wallpaper'
old=main.get_value('pipelines'); builder=GLib.VariantBuilder.new(old.get_type())
for i in range(old.n_children()):
    entry=old.get_child_value(i)
    assert entry.get_child_value(0).get_string()!=key, 'Preset already exists; inspect instead of overwriting.'
    builder.add_value(entry)
# Empty effects renders the wallpaper directly, without blur or dimming.
builder.add_value(GLib.Variant('{sa{sv}}',(key,{'name':GLib.Variant('s','Clear overview wallpaper'),'effects':GLib.Variant('av',[])})))
main.set_value('pipelines',builder.end()); Gio.Settings.sync()
overview.set_string('pipeline',key); Gio.Settings.sync()
enabled=shell.get_strv('enabled-extensions')
if 'overview-card-glass@local' not in enabled: shell.set_strv('enabled-extensions',enabled+['overview-card-glass@local'])
Gio.Settings.sync()
print('Old card-hiding extension disabled. Clear wallpaper pipeline active. New card blur companion queued for next login.')
