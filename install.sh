#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
EXT_DIR="${HOME}/.local/share/gnome-shell/extensions"
BG_DIR="${HOME}/.local/share/backgrounds"
STAMP="$(date +%Y%m%d-%H%M%S)"
WALLPAPER_NAME="2026-01-29-09-51-04-pexels-njeromin-19027701.jpg"

mkdir -p "${EXT_DIR}" "${HOME}/.config/gtk-3.0" "${HOME}/.config/gtk-4.0" "${BG_DIR}"

echo "Installing GNOME Shell extensions (Blur My Shell, rounded corners, Mission Control, dock glass, and companions)..."
shopt -s nullglob
for src in "${ROOT}/gnome-shell-extensions/"*; do
  [[ -d "${src}" ]] || continue
  uuid="$(basename "${src}")"
  dest="${EXT_DIR}/${uuid}"
  mkdir -p "${dest}"
  rsync -a --delete --exclude '__pycache__' "${src}/" "${dest}/"
  if [[ -d "${dest}/schemas" ]]; then
    glib-compile-schemas "${dest}/schemas" 2>/dev/null || true
  fi
  echo "  copied ${uuid}"
done
shopt -u nullglob

backup_css() {
  local file="$1"
  if [[ -f "${file}" ]]; then
    cp -a "${file}" "${file}.bak-${STAMP}"
    echo "  backed up ${file}"
  fi
}

echo "Installing GTK glass CSS..."
backup_css "${HOME}/.config/gtk-3.0/gtk.css"
backup_css "${HOME}/.config/gtk-4.0/gtk.css"
cp -a "${ROOT}/gtk/gtk-3.0/gtk.css" "${HOME}/.config/gtk-3.0/gtk.css"
cp -a "${ROOT}/gtk/gtk-4.0/gtk.css" "${HOME}/.config/gtk-4.0/gtk.css"
cp -a "${ROOT}/gtk/gtk-3.0/settings.ini" "${HOME}/.config/gtk-3.0/settings.ini"
cp -a "${ROOT}/gtk/gtk-4.0/settings.ini" "${HOME}/.config/gtk-4.0/settings.ini"

if [[ -f "${ROOT}/wallpaper/${WALLPAPER_NAME}" ]]; then
  echo "Installing wallpaper..."
  cp -a "${ROOT}/wallpaper/${WALLPAPER_NAME}" "${BG_DIR}/${WALLPAPER_NAME}"
  WALL_URI="file://${BG_DIR}/${WALLPAPER_NAME}"
else
  WALL_URI=""
fi

load_dconf() {
  local key="$1"
  local file="$2"
  if [[ -s "${file}" ]]; then
    dconf load "${key}" < "${file}"
    echo "  loaded ${key}"
  fi
}

if command -v dconf >/dev/null 2>&1; then
  echo "Loading design settings..."
  load_dconf /org/gnome/shell/extensions/dash-to-dock/ "${ROOT}/settings/dash-to-dock.dconf"
  load_dconf /org/gnome/shell/extensions/blur-my-shell/ "${ROOT}/settings/blur-my-shell.dconf"
  load_dconf /org/gnome/shell/extensions/ding/ "${ROOT}/settings/ding.dconf"
  load_dconf /org/gnome/shell/extensions/rounded-window-corners-reborn/ "${ROOT}/settings/rounded-window-corners.dconf"
  load_dconf /org/gnome/shell/extensions/space-bar/ "${ROOT}/settings/space-bar.dconf"
  load_dconf /org/gnome/shell/extensions/tasks-in-panel/ "${ROOT}/settings/tasks-in-panel.dconf"
  load_dconf /org/gnome/shell/extensions/show-desktop-plus/ "${ROOT}/settings/show-desktop-plus.dconf"
  load_dconf /org/gnome/shell/extensions/tiling-assistant/ "${ROOT}/settings/tiling-assistant.dconf"
  load_dconf /org/gnome/shell/extensions/astra-monitor/ "${ROOT}/settings/astra-monitor.dconf"
  load_dconf /org/gnome/shell/extensions/multi-monitors-bar/ "${ROOT}/settings/multi-monitors-bar.dconf"
  load_dconf /org/gnome/desktop/interface/ "${ROOT}/settings/gnome-desktop-interface.dconf"

  if [[ -n "${WALL_URI}" ]]; then
    dconf write /org/gnome/desktop/background/picture-uri "'${WALL_URI}'"
    dconf write /org/gnome/desktop/background/picture-uri-dark "'${WALL_URI}'"
    dconf write /org/gnome/desktop/background/picture-options "'zoom'"
    dconf write /org/gnome/desktop/screensaver/picture-uri "'${WALL_URI}'"
    dconf write /org/gnome/desktop/screensaver/picture-options "'zoom'"
    echo "  set wallpaper to ${WALL_URI}"
  fi

  dconf write /org/gnome/shell/disable-user-extensions false
else
  echo "dconf not found; skipped settings. Install dconf-cli and re-run."
fi

enable_ext() {
  local uuid="$1"
  if gnome-extensions info "${uuid}" >/dev/null 2>&1; then
    gnome-extensions enable "${uuid}" && echo "  enabled ${uuid}" || echo "  could not enable ${uuid} (log out, then enable in Extensions)"
  else
    echo "  skipped ${uuid} (not installed on this GNOME version yet)"
  fi
}

if command -v gnome-extensions >/dev/null 2>&1; then
  echo "Enabling the same extension set..."
  enable_ext blur-my-shell@aunetx
  enable_ext rounded-window-corners@fxgn
  enable_ext overview-card-glass@local
  enable_ext overview-layout@local
  enable_ext dock-hover-glass@local
  enable_ext space-bar@luchrioh
  enable_ext tasks-in-panel@fthx
  enable_ext show-desktop-plus@attentivecoder
  enable_ext monitor@astraext.github.io
  enable_ext multi-monitors-bar@frederykabryan
  enable_ext ubuntu-dock@ubuntu.com
  enable_ext ding@rastersoft.com
  enable_ext tiling-assistant@ubuntu.com
  gnome-extensions disable overview-glass@local >/dev/null 2>&1 || true
else
  echo "gnome-extensions CLI not found; enable the copied extensions after login."
fi

echo
echo "Done. Log out and back in (or reboot) so GNOME Shell loads Blur My Shell and the rest."
echo "Do not enable overview-glass@local together with overview-card-glass@local."
echo "Ubuntu Dock and Desktop Icons NG must be present (they ship with Ubuntu)."
