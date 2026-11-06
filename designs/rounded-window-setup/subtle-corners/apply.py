from pathlib import Path
from datetime import datetime
import json, shutil
from gi.repository import Gio, GLib
root=Path('/home/user')
backup=root/'rounded-window-setup/subtle-corners'/datetime.now().strftime('%Y%m%d-%H%M%S')
backup.mkdir()
def settings(uuid, schema):
    source=Gio.SettingsSchemaSource.new_from_directory(str(root/'.local/share/gnome-shell/extensions'/uuid/'schemas'), Gio.SettingsSchemaSource.get_default(), False)
    return Gio.Settings.new_full(source.lookup(schema,False),None,None)
r=settings('rounded-window-corners@fxgn','org.gnome.shell.extensions.rounded-window-corners-reborn')
b=settings('blur-my-shell@aunetx','org.gnome.shell.extensions.blur-my-shell.applications')
shell=Gio.Settings.new('org.gnome.shell')
keys=['settings-version','global-rounded-corner-settings','skip-libadwaita-app','skip-libhandy-app','border-width','keep-shadow-for-maximized-fullscreen']
snapshot={'rounded':{k:r.get_value(k).print_(True) for k in keys},'blur':{k:b.get_value(k).print_(True) for k in ['corner-radius','corner-when-maximized']},'enabled':shell.get_strv('enabled-extensions')}
(backup/'settings.json').write_text(json.dumps(snapshot,indent=2))
for ver in ('3.0','4.0'):
    path=root/f'.config/gtk-{ver}/gtk.css'
    shutil.copy2(path,backup/f'gtk-{ver}.css')
    css=path.read_text()
    if ver=='4.0':
        css+='''\n/* Subtle corners: native geometry and inner clipping share one radius. */
window.csd, window.csd.maximized, window.csd.fullscreen,
window.csd.tiled, window.csd.tiled-top, window.csd.tiled-bottom,
window.csd.tiled-left, window.csd.tiled-right {
  --window-radius: 12px;
  border-radius: 12px;
  outline: none;
}
'''
    else:
        css+='''\n/* Match native decoration to the compositor's subtle outer curve. */
window.csd decoration { border-radius: 12px; }
window.csd headerbar { border-top-left-radius: 12px; border-top-right-radius: 12px; }
'''
    path.write_text(css)
r.set_uint('settings-version',9)
r.set_value('global-rounded-corner-settings',GLib.Variant('a{sv}',{
 'padding':GLib.Variant('a{su}',dict(left=0,right=0,top=0,bottom=0)),
 'keepRoundedCorners':GLib.Variant('a{sb}',dict(maximized=True,fullscreen=True)),
 'borderRadius':GLib.Variant('u',12),'smoothing':GLib.Variant('d',0),
 'borderColor':GLib.Variant('(dddd)',(.5,.5,.5,1)), 'enabled':GLib.Variant('b',True)}))
r.set_boolean('skip-libadwaita-app',True)
r.set_boolean('skip-libhandy-app',False)
r.set_int('border-width',0)
r.set_boolean('keep-shadow-for-maximized-fullscreen',False)
b.set_int('corner-radius',12)
b.set_boolean('corner-when-maximized',True)
Gio.Settings.sync()
print('Backup:',backup)
print('Corners:',r.get_value('global-rounded-corner-settings').print_(True))
