# Ubuntu Glass Desktop Pack

This folder is a full copy of the frosted-glass Ubuntu desktop from the original machine: **Blur My Shell** (the installed extension plus its pipelines), Mission Control behaviour, rounded corners, GTK glass CSS, wallpaper, dconf, and every earlier design kit.

On a new Ubuntu PC, clone or unzip this folder and run `install.sh`. The new session should inherit the same look.

Tested on **Ubuntu 25.10 / GNOME 50**. Use the same Ubuntu generation when you can.

## What is inside

```
ubuntu-glass-desktop-pack/
  install.sh
  gnome-shell-extensions/          live extensions, including Blur My Shell
    blur-my-shell@aunetx/          compositor blur (panel, dock, apps, lock screen)
    rounded-window-corners@fxgn/
    overview-card-glass@local/     Mission Control tray frost after settle
    overview-layout@local/         keep Ubuntu Dock visible in Overview
    overview-glass@local/          older wallpaper-hide companion (not enabled)
    dock-hover-glass@local/        14% dock icon magnification
    space-bar@luchrioh/
    tasks-in-panel@fthx/
    show-desktop-plus@attentivecoder/
    monitor@astraext.github.io/
    multi-monitors-bar@frederykabryan/
    MinimizeToDockNotApp/
  gtk/                             Nautilus / libadwaita glass CSS
  wallpaper/                       current desktop wallpaper
  settings/                        dconf dumps (Blur My Shell pipelines included)
  snapshots/mission-control-rollback
  designs/                         every older kit used to build this look
```

`gnome-shell-extensions/` + `gtk/` + `settings/` + `wallpaper/` is the **live look**.  
`designs/` is history so you can re-apply or roll back an older experiment.

## Before you install

1. Finish Ubuntu first-boot and sign in as a normal user.
2. Install helpers:

   ```bash
   sudo apt update
   sudo apt install -y gnome-shell-extension-manager \
     gnome-shell-extension-ubuntu-dock \
     gnome-shell-extension-desktop-icons-ng \
     dconf-cli rsync libglib2.0-bin
   ```

Ubuntu Dock (`ubuntu-dock@ubuntu.com`), Desktop Icons NG (`ding@rastersoft.com`), and Tiling Assistant usually ship with Ubuntu. This pack does not replace those system extensions; it copies your **user** extensions, including the full **Blur My Shell** tree.

`transparent-top-bar@zhanghai.me` was enabled on the original PC but was not present as files. Install it from [GNOME Extensions](https://extensions.gnome.org/) only if you still want that panel trick. The glass look does not depend on it.

## Install on the new system

```bash
cd ubuntu-glass-desktop-pack
chmod +x install.sh
./install.sh
```

Then **log out and log back in** (Wayland cannot reload GNOME Shell with Alt+F2 `r`).

`install.sh` will:

- copy **Blur My Shell** and every other bundled extension into `~/.local/share/gnome-shell/extensions/`
- compile each extension’s GSettings schemas
- install GTK 3/4 glass CSS (backs up existing `gtk.css`)
- copy the wallpaper and point GNOME at it
- load Blur My Shell pipelines and the other dconf dumps
- enable the same extension set (skipping any UUID this GNOME version cannot load)

Do **not** enable `overview-glass@local` together with `overview-card-glass@local`.

## What the live look does

- **Blur My Shell** blurs the panel, dock, lock screen, and application surfaces using the saved pipelines (`pipeline_frosted_apps`, lock-screen black glass, dock refraction, and the rest in `settings/blur-my-shell.dconf`). Application **content opacity stays 255** so text stays readable; frost comes from CSS + blur, not faded glyphs.
- **Mission Control**: wallpaper stays still and unzoomed; app windows stay sharp while they move; after Overview settles (~280 ms) only the tray behind windows is a blurred wallpaper copy, clipped above the dock, with no card border.
- **Dock** stays on screen in Overview.
- **GTK** Files windows and other libadwaita surfaces use the glass CSS.
- **Rounded Window Corners Reborn** keeps the corner radius used with that CSS.

## Historical kits in `designs/`

These are the earlier apply/rollback trees. You do not need them for a first install. Read a kit’s `apply.py` / `rollback.py` before running it.

| Folder | Role |
|--------|------|
| `blur-my-shell-v74-reference` | Blur My Shell v74 source used as reference |
| `blur-my-shell-dynamic-fix` | Dynamic blur / `libblur-effect` work |
| `blur-my-shell-hover-fix` | Dock/panel hover blur pipeline |
| `blur-my-shell-overview-fix` | Overview blur pipelines |
| `gnome-rounded-blur-source` | Rounded blur C source |
| `rounded-window-setup` | Rounded-corner experiments and zips |
| `lockscreen-glass` | Lock screen glass |
| `unified-frost` | Shared frost / corners |
| `desktop-glass-redesign` | GTK glass palette |
| `translucency-balance` | App glass vs Blur My Shell balance |
| `glass-opacity-fix` / `glass-readability-fix` / `glass-nested-dock-fix` | Dock and nested-glass fixes |
| `overview-card-fix` | Earlier Mission Control card sources |

## Restore the 6 Nov 2026 Mission Control snapshot

```bash
chmod +x restore-mission-control-snapshot.sh
./restore-mission-control-snapshot.sh
```

Then log out. That snapshot is dock pinned + tray frost, without the later desktop-veil experiment.

## After install, check

1. Panel and dock are frosted (Blur My Shell).
2. Super / hot corner: Overview, dock still visible, wallpaper clear while windows move, tray frosts after settle.
3. Files windows: glass surfaces, readable text.
4. Lock screen: black-glass pipeline.
5. Extensions app: `blur-my-shell@aunetx`, `overview-card-glass@local`, `overview-layout@local` on.

If an extension refuses to load, GNOME may not match `shell-version` in that extension’s `metadata.json`. Prefer Ubuntu 25.10 / GNOME 50.

## GitHub

Use this folder as the repository root:

```bash
cd ubuntu-glass-desktop-pack
git init
git add .
git commit -m "Add Ubuntu glass desktop pack"
```

Do not add SSH keys, browser profiles, or unrelated home folders. WhiteSur theme zips from other setup trees are not part of this pack.
