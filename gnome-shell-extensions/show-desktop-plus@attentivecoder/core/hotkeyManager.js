const HOTKEY_ID = 'show-desktop-hotkey';

export default class HotkeyManager {
    constructor(windowManager, extension, gnomeUI) {
        // Core dependencies
        this._windowManager = windowManager;
        this._extension = extension;

        // GNOME Shell API bindings (injected for testability)
        this._ui = gnomeUI;

        // Tracks whether the keybinding is currently registered
        this._isHotkeySet = false;
    }

    /**
     * Enables the hotkey if the user has it enabled in settings.
     * Handles:
     *  - removing old keybinding (if any)
     *  - adding new keybinding
     *  - catching GNOME Shell keybinding errors
     */
    enable() {
        const { Meta, Shell, Main } = this._ui;

        // Hotkey should work in normal mode, overview, and popup dialogs
        const mode =
            Shell.ActionMode.NORMAL |
            Shell.ActionMode.OVERVIEW |
            Shell.ActionMode.POPUP;

        // Prevent repeated firing when holding the key
        const flag = Meta.KeyBindingFlags.IGNORE_AUTOREPEAT;

        // Always remove any existing binding before adding a new one
        this.disable();

        // If user disabled hotkeys in settings, do nothing
        if (!this._extension._settings.get_boolean('enable-hotkey'))
            return;

        try {
            Main.wm.addKeybinding(
                HOTKEY_ID,
                this._extension._settings,
                flag,
                mode,
                () => this._windowManager.toggleDesktop()
            );

            this._isHotkeySet = true;

        } catch (e) {
            // GNOME Shell sometimes throws if keybinding is invalid or already taken
            console.error('Failed to add keybinding', e);
            this._isHotkeySet = false;
        }
    }

    /**
     * Removes the hotkey if it was previously registered.
     * Safe to call even if the hotkey was never set.
     */
    disable() {
        const { Main } = this._ui;

        if (this._isHotkeySet) {
            try {
                Main.wm.removeKeybinding(HOTKEY_ID);
            } catch (e) {
                // Ignore — GNOME Shell may throw if keybinding doesn't exist
            }
        }

        this._isHotkeySet = false;
    }
}
