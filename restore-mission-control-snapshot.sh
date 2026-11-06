#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SRC="${ROOT}/snapshots/mission-control-rollback/20261106-173630"
EXT="${HOME}/.local/share/gnome-shell/extensions"
cp -a "${SRC}/overview-card-glass@local/." "${EXT}/overview-card-glass@local/"
cp -a "${SRC}/overview-layout@local/." "${EXT}/overview-layout@local/"
gnome-extensions disable overview-card-glass@local || true
gnome-extensions enable overview-card-glass@local || true
gnome-extensions disable overview-layout@local || true
gnome-extensions enable overview-layout@local || true
echo "Restored the 6 Nov 2026 Mission Control snapshot. Log out to apply fully."
