import { bindSwitchRow } from '../util/bindings.js';

/**
 * Initializes the “Behavior” section of the preferences window.
 *
 * This section currently contains a single toggle:
 *   - "current-monitor-only": whether hide/show applies only to the
 *     monitor the user is currently on.
 *
 * The UI is defined in behavior.ui, and this function simply binds
 * the Gtk.SwitchRow to the corresponding GSettings key.
 */
export function initBehavior(builder, settings) {
    // SwitchRow for enabling “current monitor only” behavior
    const currentMonitorRow = builder.get_object('currentMonitor_row');

    // Bind UI ↔ Settings
    bindSwitchRow(settings, 'current-monitor-only', currentMonitorRow);
}
