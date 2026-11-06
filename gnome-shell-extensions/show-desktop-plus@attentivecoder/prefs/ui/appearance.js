import { bindComboRow, bindSwitchRow } from '../util/bindings.js';

/**
 * Initializes the “Appearance” section of the preferences window.
 *
 * This function wires the GtkBuilder UI elements to GSettings keys using
 * the shared binding helpers. The UI itself is defined in appearance.ui.
 */
export function initAppearance(builder, settings) {
    // ComboRow for selecting icon style (AUTO / DESKTOP / COMPUTER)
    const iconStyleRow = builder.get_object('iconStyle_row');

    // SwitchRow for toggling the hidden-window count badge
    const showCountRow = builder.get_object('showHiddenCount_row');

    // Bind UI → Settings and Settings → UI
    bindComboRow(settings, 'icon-style', iconStyleRow);
    bindSwitchRow(settings, 'show-hidden-count', showCountRow);
}
