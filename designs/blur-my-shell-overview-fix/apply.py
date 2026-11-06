from pathlib import Path
from datetime import datetime
import gi, subprocess, json
from gi.repository import Gio, GLib
schema_dir='/home/user/.local/share/gnome-shell/extensions/blur-my-shell@aunetx/schemas'
source=Gio.SettingsSchemaSource.new_from_directory(schema_dir,Gio.SettingsSchemaSource.get_default(),False)
def settings(name):
    return Gio.Settings.new_full(source.lookup('org.gnome.shell.extensions.blur-my-shell'+name,False),None,None)
main=settings(''); overview=settings('.overview')
base=Path('/home/user/blur-my-shell-overview-fix')
backup=base/datetime.now().strftime('%Y%m%d-%H%M%S'); backup.mkdir()
(backup/'settings-before.dconf').write_bytes(subprocess.check_output(['dconf','dump','/org/gnome/shell/extensions/blur-my-shell/']))
old=main.get_value('pipelines'); old_ref=overview.get_value('pipeline')
(backup/'pipelines-before.gvariant').write_text(old.print_(True))
(backup/'overview-pipeline-before.gvariant').write_text(old_ref.print_(True))
new_id='pipeline_overview_smooth_'+datetime.now().strftime('%Y%m%d%H%M%S')
effect=GLib.Variant('a{sv}', {'type':GLib.Variant('s','native_static_gaussian_blur'), 'id':GLib.Variant('s','effect_overview_smooth_'+datetime.now().strftime('%Y%m%d%H%M%S')), 'params':GLib.Variant('a{sv}',{'unscaled_radius':GLib.Variant('d',30.0),'brightness':GLib.Variant('d',0.75)})})
entry=GLib.Variant('{sa{sv}}',(new_id,{'name':GLib.Variant('s','Smooth overview'),'effects':GLib.Variant('av',[effect])}))
builder=GLib.VariantBuilder.new(old.get_type())
for i in range(old.n_children()): builder.add_value(old.get_child_value(i))
builder.add_value(entry)
assert main.set_value('pipelines',builder.end())
Gio.Settings.sync()
assert overview.set_string('pipeline',new_id)
Gio.Settings.sync()
after=main.get_value('pipelines')
assert after.n_children()==old.n_children()+1
for i in range(old.n_children()):
    e=old.get_child_value(i); k=e.get_child_value(0).get_string()
    assert after.lookup_value(k,None).equal(e.get_child_value(1))
assert overview.get_string('pipeline')==new_id
(backup/'new-pipeline-id').write_text(new_id)
(base/'latest-path').write_text(str(backup))
(backup/'settings-after.dconf').write_bytes(subprocess.check_output(['dconf','dump','/org/gnome/shell/extensions/blur-my-shell/']))
print('Applied Smooth overview: radius 30, brightness 0.75, no pixelation/corner effects.')
print('All existing pipeline definitions preserved exactly. Backup:',backup)
