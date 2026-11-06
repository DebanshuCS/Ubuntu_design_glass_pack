#!/usr/bin/python3
from pathlib import Path
import subprocess
from gi.repository import Gio, GLib
base=Path('/home/user/blur-my-shell-overview-fix')
backup=Path((base/'latest-path').read_text())
source=Gio.SettingsSchemaSource.new_from_directory('/home/user/.local/share/gnome-shell/extensions/blur-my-shell@aunetx/schemas',Gio.SettingsSchemaSource.get_default(),False)
def settings(suffix):
    return Gio.Settings.new_full(source.lookup('org.gnome.shell.extensions.blur-my-shell'+suffix,False),None,None)
main=settings(''); overview=settings('.overview')
new_id=(backup/'new-pipeline-id').read_text()
if overview.get_string('pipeline')==new_id:
    overview.set_value('pipeline',GLib.Variant.parse(None,(backup/'overview-pipeline-before.gvariant').read_text(),None,None))
    Gio.Settings.sync()
# Keep the preset if the user has since assigned it to another component.
dump=subprocess.check_output(['dconf','dump','/org/gnome/shell/extensions/blur-my-shell/'],text=True)
if dump.count(new_id)==1:
    current=main.get_value('pipelines'); builder=GLib.VariantBuilder.new(current.get_type())
    for i in range(current.n_children()):
        entry=current.get_child_value(i)
        if entry.get_child_value(0).get_string()!=new_id:
            builder.add_value(entry)
    main.set_value('pipelines',builder.end()); Gio.Settings.sync()
print('Overview selection restored if still using the trial; other settings preserved.')
