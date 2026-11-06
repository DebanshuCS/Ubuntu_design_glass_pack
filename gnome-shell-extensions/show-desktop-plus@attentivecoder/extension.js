import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';
import ExtensionController from './core/extensionController.js';

/**
 * Entry point for the GNOME Shell extension.
 *
 * This class is intentionally minimal:
 *  - GNOME Shell instantiates it automatically
 *  - It delegates all real logic to ExtensionController
 *  - It manages only lifecycle wiring (enable/disable)
 */
export default class ShowDesktopPlus extends Extension {
    enable() {
        // Human‑readable extension name (used for panel role, prefs title, etc.)
        this._extensionName = this.metadata.name || 'Show Desktop Plus';

        // GSettings schema for this extension
        this._settings = this.getSettings();

        // Main controller orchestrates all subsystems
        this._controller = new ExtensionController(this);
        this._controller.enable();
    }

    disable() {
        // Cleanly tear down all subsystems
        if (this._controller) {
            this._controller.disable();
            this._controller = null;
        }

        // Clear references
        this._settings = null;
        this._extensionName = null;
    }
}

