/* extension.js
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * SPDX-License-Identifier: GPL-2.0-or-later
 */

/* extension.js
 * SPDX-License-Identifier: GPL-2.0-or-later
 */

import { Extension } from "resource:///org/gnome/shell/extensions/extension.js";
import Clutter from "gi://Clutter";
import Meta from "gi://Meta";
import * as Main from "resource:///org/gnome/shell/ui/main.js";

// Import our custom GLSL Shader Effect
import { GenieEffect } from "./GenieEffect.js";

export default class GenieMinimizeExtension extends Extension {
  enable() {
    // Connect to the window manager's minimize signal
    this._minimizeId = global.window_manager.connect(
      "minimize",
      this._onMinimize.bind(this),
    );
  }

  disable() {
    // Clean up when the extension is turned off
    if (this._minimizeId) {
      global.window_manager.disconnect(this._minimizeId);
      this._minimizeId = null;
    }
  }

  _onMinimize(shellwm, actor) {
    // Find the destination icon in the dock
    let targetRect = this._getIconGeometry(actor.meta_window);

    // Prevent the default GNOME scale animation
    actor.set_scale(1, 1);

    // Create and attach the custom Genie Shader
    let genieShader = new GenieEffect();
    // We use a named effect so we can easily target it in the animation
    actor.add_effect_with_name("genie", genieShader);

    // Animate the window down to the dock
    actor.ease({
      // Move to the dock icon
      translation_x: targetRect.x - actor.x,
      translation_y: targetRect.y - actor.y,

      // Scale down so it visually fits into the dock
      scale_x: 0.1,
      scale_y: 0.1,

      // Animate the custom 'progress' property inside our GenieEffect from 0.0 to 1.0
      "@effects.genie.progress": 1.0,

      duration: 500, // Slightly longer duration looks better for the curve
      mode: Clutter.AnimationMode.EASE_IN_OUT_QUAD,

      onComplete: () => {
        // Remove the shader effect so the window isn't permanently deformed
        actor.remove_effect_by_name("genie");

        // Tell the window manager the animation is done
        shellwm.completed_minimize(actor);
      },
    });
  }

  _getIconGeometry(metaWindow) {
    let app = global.window_tracker.get_window_app(metaWindow);
    if (!app) return this._getFallbackGeometry();

    let dashIcons = Main.overview.dash._box.get_children();
    let targetIcon = null;

    for (let i = 0; i < dashIcons.length; i++) {
      let delegate = dashIcons[i].child?._delegate;
      if (delegate && delegate.app === app) {
        targetIcon = dashIcons[i];
        break;
      }
    }

    if (targetIcon) {
      let [x, y] = targetIcon.get_transformed_position();
      let [width, height] = targetIcon.get_transformed_size();
      return { x, y, width, height };
    }

    return this._getFallbackGeometry();
  }

  _getFallbackGeometry() {
    let monitor = Main.layoutManager.primaryMonitor;
    return {
      x: monitor.x + monitor.width / 2 - 25,
      y: monitor.y + monitor.height,
      width: 50,
      height: 50,
    };
  }
}
