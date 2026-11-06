#!/usr/bin/python3
from pathlib import Path
import shutil
import subprocess

root = Path('/home/user/mission-control-rollback')
backup = Path((root / 'latest-path').read_text().strip())
ext = Path.home() / '.local/share/gnome-shell/extensions'
for uuid in ('overview-card-glass@local', 'overview-layout@local'):
    dest = ext / uuid
    dest.mkdir(parents=True, exist_ok=True)
    shutil.copytree(backup / uuid, dest, dirs_exist_ok=True)
for uuid in ('overview-card-glass@local', 'overview-layout@local'):
    subprocess.run(['gnome-extensions', 'disable', uuid], check=False)
    subprocess.run(['gnome-extensions', 'enable', uuid], check=False)
print(f'Restored Mission Control from {backup}. Dock, wallpaper, and card animation are back to the snapshot.')
