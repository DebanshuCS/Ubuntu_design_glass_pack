import { bindComboRow } from '../util/bindings.js';

/**
 * Initializes the “Controls” section of the preferences window.
 *
 * This section configures what happens when the user clicks the panel icon:
 *   - left-click action
 *   - middle-click action
 *
 * Each row is a Gtk.DropDown (ComboRow) bound to a GSettings enum key.
 */
export function initControls(builder, settings) {
    // ComboRow for selecting the left-click action
    const leftClickRow = builder.get_object('leftClickAction_row');

    // ComboRow for selecting the middle-click action
    const middleClickRow = builder.get_object('middleClickAction_row');

    // Bind UI ↔ Settings
    bindComboRow(settings, 'left-click-action', leftClickRow);
    bindComboRow(settings, 'middle-click-action', middleClickRow);
}
