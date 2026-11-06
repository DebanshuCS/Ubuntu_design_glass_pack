/**
 * StateStore manages all hidden‑window state for the extension.
 *
 * Structure:
 *   Map<workspaceIndex, Map<monitorKey, Array<windowId>>>
 *
 * Example:
 *   {
 *     0: { -1: [12, 15, 18] },          // workspace 0, all monitors
 *     1: { 0: [22], 1: [30, 31] }       // workspace 1, per‑monitor
 *   }
 *
 * This class is intentionally minimal — it stores and retrieves data,
 * while WindowManager handles all logic and cleanup.
 */
export default class StateStore {
    constructor() {
        // Map<number, Map<number, number[]>>
        this._storedStateByWorkspace = new Map();
    }

    /**
     * Returns the hidden‑window map for a workspace, or undefined.
     */
    getWorkspaceMap(wsIndex) {
        return this._storedStateByWorkspace.get(wsIndex);
    }

    /**
     * Sets the hidden‑window map for a workspace.
     */
    setWorkspaceMap(wsIndex, map) {
        this._storedStateByWorkspace.set(wsIndex, map);
    }

    /**
     * Deletes all hidden‑window state for a workspace.
     */
    deleteWorkspace(wsIndex) {
        this._storedStateByWorkspace.delete(wsIndex);
    }

    /**
     * Clears all stored state across all workspaces.
     */
    clear() {
        this._storedStateByWorkspace.clear();
    }

    /**
     * Number of workspaces currently tracked.
     */
    get size() {
        return this._storedStateByWorkspace.size;
    }

    /**
     * Iterator over [workspaceIndex, map] pairs.
     */
    entries() {
        return this._storedStateByWorkspace.entries();
    }

    /**
     * Iterates over each workspace map.
     */
    forEach(callback) {
        this._storedStateByWorkspace.forEach(callback);
    }

    /**
     * Returns true if the workspace has stored hidden windows.
     */
    hasWorkspace(wsIndex) {
        return this._storedStateByWorkspace.has(wsIndex);
    }

    /**
     * Returns the workspace map, creating it if missing.
     */
    getOrCreateWorkspaceMap(wsIndex) {
        let map = this._storedStateByWorkspace.get(wsIndex);
        if (!map) {
            map = new Map();
            this._storedStateByWorkspace.set(wsIndex, map);
        }
        return map;
    }

    /**
     * Removes a window ID from all workspace maps.
     * Used when a window is closed or unminimized.
     *
     * If a workspace becomes empty, it is removed entirely.
     */
    deleteWindowId(id) {
        for (const [wsIndex, map] of this._storedStateByWorkspace) {
            for (const [key, list] of map) {
                const filtered = list.filter(wid => wid !== id);

                if (filtered.length > 0)
                    map.set(key, filtered);
                else
                    map.delete(key);
            }

            if (map.size === 0)
                this._storedStateByWorkspace.delete(wsIndex);
        }
    }
}
