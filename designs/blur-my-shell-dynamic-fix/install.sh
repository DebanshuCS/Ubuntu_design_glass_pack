#!/bin/bash
set -euo pipefail
base=/home/user/blur-my-shell-dynamic-fix
source_dir=/home/user/gnome-rounded-blur-source
expected_commit=f3bfcc796e1214c1e1d4287ee35cb132ad8133f0
[[ $(id -u) != 0 ]] || { echo 'Run as your desktop user, without sudo before this script.'; exit 1; }
[[ $(gnome-shell --version) == 'GNOME Shell 50.'* ]] || { echo 'This build is prepared for GNOME 50 only.'; exit 1; }
[[ $(git -C "$source_dir" rev-parse HEAD) == "$expected_commit" ]]
git -C "$source_dir" diff --quiet HEAD --
arch=$(dpkg-architecture -qDEB_HOST_MULTIARCH)
libdir="/usr/lib/$arch"
files=("$libdir/libblur-effect-1.0.so.1.0.0" "$libdir/libblur-effect-1.0.so.1" "$libdir/libblur-effect-1.0.so" "$libdir/girepository-1.0/Blur-1.0.typelib")
for file in "${files[@]}"; do
    [[ ! -e "$file" && ! -L "$file" ]] || { echo "Refusing to overwrite existing library: $file"; exit 1; }
done
# Authenticated Ubuntu packages; no downloaded shell scripts are executed.
sudo -v
dpkg-query -W -f='${binary:Package}\t${Version}\n' > "$base/packages-before.tsv"
sudo apt-get install --no-install-recommends libmutter-18-dev libglib2.0-dev gobject-introspection meson ninja-build build-essential
[[ $(pkg-config --modversion libmutter-18) == 50.* ]]
build_dir="$base/build"
stage_dir="$base/stage"
if [[ -f "$build_dir/build.ninja" ]]; then
    meson setup --reconfigure "$build_dir" "$source_dir" --prefix=/usr --libdir="lib/$arch"
else
    meson setup "$build_dir" "$source_dir" --prefix=/usr --libdir="lib/$arch"
fi
meson compile -C "$build_dir"
meson test -C "$build_dir" --print-errorlogs
DESTDIR="$stage_dir" meson install -C "$build_dir" --no-rebuild
# Test the staged library before copying any runtime files into system paths.
GI_TYPELIB_PATH="$stage_dir$libdir/girepository-1.0:/usr/lib/$arch/mutter-18" \
LD_LIBRARY_PATH="$stage_dir$libdir:/usr/lib/$arch/mutter-18${LD_LIBRARY_PATH:+:$LD_LIBRARY_PATH}" \
gjs -c 'const Blur = imports.gi.Blur; if (!Blur.BlurEffect.list_properties().some(p => p.name === "corner-radius")) throw new Error("Missing corner-radius support"); print("PASS: rounded dynamic blur property available");'
printf '%s\n' "${files[@]}" > "$base/runtime-files.txt"
# Install only the runtime library and GI metadata, not system extension files.
sudo install -d "$libdir/girepository-1.0"
for file in "${files[@]}"; do
    sudo cp -a -- "$stage_dir$file" "$file"
done
sudo ldconfig
sha256sum "${files[@]}" > "$base/runtime-sha256.txt"
# Preserve all user-chosen radii, brightness, sigma, and other components.
gsettings --schemadir /home/user/.local/share/gnome-shell/extensions/blur-my-shell@aunetx/schemas set org.gnome.shell.extensions.blur-my-shell.popup static-blur false
printf '\nInstalled rounded dynamic blur support. Save your work, then log out and back in when ready.\nThis script does not log you out or restart GNOME.\nAfter login, run: /home/user/blur-my-shell-dynamic-fix/verify.sh\n'
