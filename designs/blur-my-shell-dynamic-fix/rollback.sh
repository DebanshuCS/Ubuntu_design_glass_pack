#!/bin/bash
set -euo pipefail
base=/home/user/blur-my-shell-dynamic-fix
[[ -f "$base/runtime-sha256.txt" ]] || { echo 'No completed library installation recorded; nothing to remove.'; exit 0; }
# Refuse to remove files replaced by a subsequent update or another installer.
sha256sum --check "$base/runtime-sha256.txt"
arch=$(dpkg-architecture -qDEB_HOST_MULTIARCH)
libdir="/usr/lib/$arch"
sudo rm -- "$libdir/libblur-effect-1.0.so.1.0.0" "$libdir/libblur-effect-1.0.so.1" "$libdir/libblur-effect-1.0.so" "$libdir/girepository-1.0/Blur-1.0.typelib"
sudo ldconfig
mv "$base/runtime-sha256.txt" "$base/removed-runtime-sha256.txt"
echo 'Library removed. Log out/login when ready. Your appearance settings were preserved.'
echo 'Build dependencies are left installed; no unrelated packages are removed.'
