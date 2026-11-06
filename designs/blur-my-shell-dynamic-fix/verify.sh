#!/bin/bash
set -euo pipefail
schemas=/home/user/.local/share/gnome-shell/extensions/blur-my-shell@aunetx/schemas
gnome-extensions info blur-my-shell@aunetx
rounded=$(gsettings --schemadir "$schemas" get org.gnome.shell.extensions.blur-my-shell rounded-blur-found)
mode=$(gsettings --schemadir "$schemas" get org.gnome.shell.extensions.blur-my-shell.popup static-blur)
printf 'Rounded dynamic blur available: %s\nPopup static-blur: %s (false means dynamic)\n' "$rounded" "$mode"
[[ $rounded == true && $mode == false ]] || { echo 'Support is not active yet. Log out/login if you have not done so since installing.'; exit 1; }
echo 'PASS: dynamic mode with rounded-corner support. Visually check calendar, Quick Settings, and app popups.'
