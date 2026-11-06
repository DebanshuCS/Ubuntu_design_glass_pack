import GObject from "gi://GObject";
import Clutter from "gi://Clutter";

export const GenieEffect = GObject.registerClass(
  {
    GTypeName: "GenieEffect",
    Properties: {
      progress: GObject.ParamSpec.float(
        "progress",
        "Progress",
        "Animation progress",
        GObject.ParamFlags.READWRITE,
        0.0,
        1.0,
        0.0,
      ),
    },
  },
  class GenieEffect extends Clutter.ShaderEffect {
    _init(params) {
      super._init(params);

      // This vertex shader runs on the GPU. It calculates the "pinch"
      const vertexShaderText = `
            uniform float u_progress;
            
            void main(void) {
                vec4 pos = cogl_position_in;
                
                // The Genie math: pinch the X axis based on the Y axis and the animation progress
                float pinch_factor = sin(pos.y * 3.14159) * u_progress;
                
                // Adjust the 50.0 to make the curve more or less extreme
                pos.x = pos.x + (pinch_factor * 50.0); 

                cogl_position_out = cogl_modelview_projection_matrix * pos;
                cogl_color_out = cogl_color_in;
                cogl_tex_coord_out[0] = cogl_tex_coord_in;
            }
        `;

      this.set_shader_source(vertexShaderText);
      this._progress = 0.0;
    }

    get progress() {
      return this._progress;
    }

    set progress(value) {
      this._progress = value;
      // Pass the updated progress value from JavaScript to the GPU
      this.set_uniform_value("u_progress", parseFloat(value));
    }
  },
);
