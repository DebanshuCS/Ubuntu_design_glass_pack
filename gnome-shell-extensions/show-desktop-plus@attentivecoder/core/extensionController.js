import StateStore from './stateStore.js';
import WindowManager from './windowManager.js';
import PanelIndicator from './panelIndicator.js';
import HotkeyManager from './hotkeyManager.js';
import { loadGnomeUI } from './gnomeUI.js';

export default class ExtensionController {
    constructor(extension) {
        // Extension metadata + settings
        this._extension = extension;

        // Persistent hidden-window state
        this._stateStore = new StateStore();

        // Runtime components (initialized in enable())
        this._windowManager = null;
        this._panelIndicator = null;
        this._hotkeyManager = null;
        this._gnomeUI = null;

        // Signal tracking
        this._workspaceSignal = null;
        this._settingsSignals = [];
    }

    /**
     * Main entry point when the extension is enabled.
     * Wires together:
     *  - GNOME UI bindings
     *  - WindowManager
     *  - PanelIndicator
     *  - HotkeyManager
     *  - workspace + settings signals
     */
    async enable() {
        this._gnomeUI = await loadGnomeUI();

        this._windowManager = new WindowManager(
            this._stateStore,
            this._extension,
            // Stryker disable next-line OptionalChaining
            () => this._panelIndicator?.updateIcon(),
            this._gnomeUI
        );

        this._panelIndicator = new PanelIndicator(
            this._windowManager,
            this._stateStore,
            this._extension,
            this._gnomeUI
        );

        this._hotkeyManager = new HotkeyManager(
            this._windowManager,
            this._extension,
            this._gnomeUI
        );

        this._panelIndicator.addToPanel();
        this._hotkeyManager.enable();

        // Update icon when workspace changes
        this._workspaceSignal = this._gnomeUI.workspace_manager.connect(
            // Stryker disable next-line StringLiteral
            'active-workspace-changed',
            () => this._panelIndicator.updateIcon()
        );

        this._connectSettings();
        this._panelIndicator.updateIcon();
    }

    /**
     * Called when the extension is disabled.
     * Ensures all signals and components are safely torn down.
     */
    disable() {
        // Stryker disable next-line ConditionalExpression
        if (this._workspaceSignal) {
            this._gnomeUI.workspace_manager.disconnect(this._workspaceSignal);
            this._workspaceSignal = null;
        }

        // Disconnect all settings signals
        for (const id of this._settingsSignals) {
            this._extension._settings.disconnect(id);
        }

        // Stryker disable next-line ArrayDeclaration
        this._settingsSignals = [];

        this._hotkeyManager?.disable();
        this._hotkeyManager = null;

        this._windowManager?.disable?.();
        this._windowManager = null;

        // Stryker disable next-line OptionalChaining
        this._panelIndicator?.destroy?.();
        this._panelIndicator = null;

        // Clear hidden-window state
        this._stateStore.clear();
    }

    /**
     * Connects settings keys to their respective update handlers.
     * Ensures UI reacts immediately to settings changes.
     */
    _connectSettings() {
        const connectChanged = (key, callback) => {
            const id = this._extension._settings.connect(`changed::${key}`, callback);
            this._settingsSignals.push(id);
        };

        connectChanged('icon-style', () => this._panelIndicator.updateIcon());
        connectChanged('show-hidden-count', () => this._panelIndicator.updateIcon());
        connectChanged('current-monitor-only', () => this._panelIndicator.updateIcon());

        // Rebuild panel button when position changes
        connectChanged('button-position', () => {
            this._panelIndicator.destroy();
            this._panelIndicator.addToPanel();
            this._panelIndicator.updateIcon();
        });
    }
}
