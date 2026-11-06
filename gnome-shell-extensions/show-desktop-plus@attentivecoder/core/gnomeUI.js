/**
 * Dynamically loads GNOME Shell UI modules.
 *
 * This function exists so the extension can:
 *  - avoid static imports (which break tests)
 *  - mock GNOME APIs in unit tests
 *  - support different GNOME versions gracefully
 *
 * Everything returned here is injected into WindowManager,
 * PanelIndicator, and HotkeyManager for full testability.
 */
export async function loadGnomeUI() {
    // Core GNOME libraries (loaded lazily)
    const St = (await import('gi://St')).default;
    const Clutter = (await import('gi://Clutter')).default;
    const GLib = (await import('gi://GLib')).default;
    const Meta = (await import('gi://Meta')).default;
    const Shell = (await import('gi://Shell')).default;

    // Shell UI modules (loaded from resource paths)
    const Main = await import('resource:///org/gnome/shell/ui/main.js');
    const PanelMenu = await import('resource:///org/gnome/shell/ui/panelMenu.js');

    return {
        // GNOME UI modules
        St,
        Clutter,
        GLib,
        Meta,
        Shell,
        Main,
        PanelMenu,

        // Global display + workspace manager
        display: global.get_display(),
        workspace_manager: global.get_workspace_manager(),

        // Bound global functions (important for testing)
        get_current_time: global.get_current_time.bind(global),
        get_window_actors: global.get_window_actors.bind(global),
    };
}
