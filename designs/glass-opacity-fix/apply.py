from pathlib import Path
from datetime import datetime
import shutil,json
from gi.repository import Gio
base=Path('/home/user/glass-opacity-fix'); backup=base/datetime.now().strftime('%Y%m%d-%H%M%S'); backup.mkdir()
css=Path('/home/user/.config/gtk-4.0/gtk.css'); shellcss=Path('/home/user/.local/share/gnome-shell/extensions/blur-my-shell@aunetx/stylesheet.css')
shutil.copy2(css,backup/'gtk.css'); shutil.copy2(shellcss,backup/'stylesheet.css')
s=css.read_text()
for a,b in [('24, 26, 32, 0.84','24, 26, 32, 0.94'),('18, 20, 26, 0.28','18, 20, 26, 0.88'),('34, 36, 44, 0.36','34, 36, 44, 0.90'),('28, 30, 38, 0.36','28, 30, 38, 0.90'),('32, 34, 42, 0.38','32, 34, 42, 0.90'),('28, 30, 38, 0.38','28, 30, 38, 0.90'),('28, 30, 38, 0.32','28, 30, 38, 0.88')]:
    assert a in s,a
    s=s.replace(a,b)
css.write_text(s)
shellcss.write_text(shellcss.read_text()+'''\n/* Readable app-folder glass: separate the folder from the app grid. */
.app-folder-dialog .appfolder-dialogs-dark {
    background-color: rgba(24, 26, 32, 0.86);
    border: 1px solid rgba(255, 255, 255, 0.12);
}
''')
source=Gio.SettingsSchemaSource.new_from_directory('/home/user/.local/share/gnome-shell/extensions/blur-my-shell@aunetx/schemas',Gio.SettingsSchemaSource.get_default(),False)
s=Gio.Settings.new_full(source.lookup('org.gnome.shell.extensions.blur-my-shell.appfolder',False),None,None)
keys=['style-dialogs','sigma','brightness','customize']
(backup/'appfolder.json').write_text(json.dumps({k:s.get_value(k).print_(True) for k in keys}))
s.delay(); s.set_int('style-dialogs',3); s.set_boolean('customize',True); s.set_int('sigma',25); s.set_double('brightness',0.75); s.apply(); Gio.Settings.sync()
(base/'latest-path').write_text(str(backup))
print('Opacity updated; backup:',backup)
