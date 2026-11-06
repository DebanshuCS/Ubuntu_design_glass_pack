from pathlib import Path
from datetime import datetime
import shutil,json,subprocess
from gi.repository import Gio,GLib
base=Path('/home/user/desktop-glass-redesign'); backup=base/('backup-'+datetime.now().strftime('%Y%m%d-%H%M%S')); backup.mkdir()
css=Path('/home/user/.config/gtk-4.0/gtk.css')
if css.exists(): shutil.copy2(css,backup/'gtk.css')
(backup/'css-existed').write_text(str(css.exists()))
source=Gio.SettingsSchemaSource.new_from_directory('/home/user/.local/share/gnome-shell/extensions/blur-my-shell@aunetx/schemas',Gio.SettingsSchemaSource.get_default(),False)
s=Gio.Settings.new_full(source.lookup('org.gnome.shell.extensions.blur-my-shell.applications',False),None,None)
changes={'static-blur':GLib.Variant('b',False),'opacity':GLib.Variant('i',255),'dynamic-opacity':GLib.Variant('b',False),'sigma':GLib.Variant('i',30),'brightness':GLib.Variant('d',0.8),'corner-radius':GLib.Variant('i',12),'enable-all':GLib.Variant('b',False),'blur-on-overview':GLib.Variant('b',False),'unblur-when-fullscreen':GLib.Variant('b',True),'blur':GLib.Variant('b',True)}
wl=s.get_strv('whitelist')
for name in ['org.gnome.*','gnome-control-center','Nautilus']:
    if name not in wl: wl.append(name)
changes['whitelist']=GLib.Variant('as',wl)
(backup/'settings.json').write_text(json.dumps({k:s.get_value(k).print_(True) for k in changes},indent=2))
(backup/'settings-full.dconf').write_bytes(subprocess.check_output(['dconf','dump','/org/gnome/shell/extensions/blur-my-shell/']))
old_css=css.read_text() if css.exists() else ''
addition='\n/* Desktop glass surface palette */\n'+(base/'gtk-glass.css').read_text()
css.write_text(old_css+addition)
(backup/'applied-css').write_text(css.read_text())
s.delay()
for k,v in changes.items(): assert s.set_value(k,v),k
s.apply(); Gio.Settings.sync()
# Finish the previously prepared overview companion without changing other entries.
shell=Gio.Settings.new('org.gnome.shell'); enabled=shell.get_strv('enabled-extensions')
(backup/'companion-was-enabled').write_text(str('overview-glass@local' in enabled))
if 'overview-glass@local' not in enabled:
    shell.set_strv('enabled-extensions',enabled+['overview-glass@local'])
Gio.Settings.sync()
(base/'latest-path').write_text(str(backup))
assert s.get_int('opacity')==255
print('Applied background-only GTK4 glass palette, dynamic blur for GNOME apps, and enabled overview companion for next login.')
print('Backup:',backup)
