import { bindComboRow } from '../util/bindings.js';

/**
 * Initializes the “Panel” section of the preferences window.
 *
 * This section controls where the indicator button appears on the GNOME panel.
 * The UI is defined in panel.ui, and this function simply binds the
 * Gtk.DropDown (ComboRow) to the corresponding GSettings enum key.
 */
export function initPanel(builder, settings) {
    // ComboRow for selecting the panel button position (left / center / right)
    const positionRow = builder.get_object('panelButtonPosition_row');

    // Bind UI ↔ Settings
    bindComboRow(settings, 'button-position', positionRow);
}
