import { bindSwitchRow } from '../util/bindings.js';

/**
 * Initializes the “Shortcuts” section of the preferences window.
 *
 * This section controls whether the global hotkey is enabled.
 * The UI is defined in shortcuts.ui, and this function simply binds
 * the Gtk.SwitchRow to the corresponding GSettings boolean key.
 */
export function initShortcuts(builder, settings) {
    // SwitchRow for enabling/disabling the global hotkey
    const hotkeyRow = builder.get_object('useHotkey_row');

    // Bind UI ↔ Settings
    bindSwitchRow(settings, 'enable-hotkey', hotkeyRow);
}
