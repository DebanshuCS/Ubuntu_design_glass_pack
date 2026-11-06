#!/bin/sh
set -eu
backup_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
ext_dir="$HOME/.local/share/gnome-shell/extensions/blur-my-shell@aunetx"
# Restore both stylesheet paths used by the two trials.
test -f "$backup_dir/original/styles/panel.css"
test -d "$ext_dir/styles"
trap 'gnome-extensions enable blur-my-shell@aunetx' EXIT
trap 'exit 130' INT TERM
gnome-extensions disable blur-my-shell@aunetx
cp -p "$backup_dir/original/styles/panel.css" "$ext_dir/styles/panel.css"
cp -p "$backup_dir/original/stylesheet.css" "$ext_dir/stylesheet.css"
rm -f -- "$ext_dir/styles/bms-hover-transparent-v4.svg"
dconf reset -f /org/gnome/shell/extensions/blur-my-shell/
dconf load /org/gnome/shell/extensions/blur-my-shell/ < "$backup_dir/settings.dconf"
gnome-extensions enable blur-my-shell@aunetx
trap - EXIT INT TERM
gnome-extensions info blur-my-shell@aunetx
