// The fluid simulation implementation here follows the Real-Time Fluid Dynamics paper by Jos Stam.
// http://graphics.cs.cmu.edu/nsp/course/15-464/Fall09/papers/StamFluidforGames.pdf

// @ts-ignore because Parcel handles this import.
import vertex_shader_source from "./vertex_shader.vert";
// @ts-ignore because Parcel handles this import.
import fragment_shader_source from "./fragment_shader.frag";
import { assert_ok, attribute_location, compiled_shader_from_source, new_rgba_float_texture, uniform_location, update_sub_image } from "./webgl_utilities";

const show_fps = false;
const debug = false;
function debug_assert_ok(gl: WebGLRenderingContext) { if (debug) { assert_ok(gl); } }

type Vec2 = { x: number, y: number };
type FlowSource = {
  position: Vec2 | null,
  velocity: Vec2,
  density: number,
  needs_movement_processing: boolean,
};

type SimulationOptions = {
  density_diffusion_rate: number,
  density_dissipation_rate: number,
  velocity_diffusion_rate: number,
  velocity_dissipation_rate: number,
  nr_intermediate_iterations: number,
};

/// Instead of a separate shader program for each rendering pass, we use one program with a uniform
/// index variable as a pass discriminator.
enum PassKind {
  Copy = 0,
  DensitySource = 1,
  DensityDiffusion = 2,
  DensityAdvection = 3,
  VelocitySource = 4,
  VelocityDiffusion = 5,
  VelocityAdvection = 6,
  VelocityProjectionStep1 = 7,
  VelocityProjectionStep2 = 8,
  VelocityProjectionStep3 = 9,
  Visualization = 10
}

const brush_radius = 8;
const brush_size = 2 * brush_radius;

function set_brush_pixels(pixels: Float32Array, velocity_x: number, velocity_y: number, density: number): boolean {
  if (pixels.length != brush_size * brush_size * 4) {
    console.error("Array size doesn't match brush dimensions.");
    return false;
  }

  for (let i = 0; i < brush_size; ++i) {
    for (let j = 0; j < brush_size; ++j) {

      const distance_to_center_squared =
        (i - brush_radius) * (i - brush_radius) +
        (j - brush_radius) * (j - brush_radius);

      if (distance_to_center_squared > brush_radius * brush_radius) {
        continue;
      }

      const k = (i * brush_size + j) * 4;
      pixels[k + 0] = velocity_x;
      pixels[k + 1] = velocity_y;
      pixels[k + 2] = density;
      pixels[k + 3] = 0;
    }
  }

  return true;
}

function begin_simulation(
  gl: WebGLRenderingContext,
  program: WebGLProgram,
  flow_source: FlowSource,
  options: SimulationOptions): boolean {

  gl.useProgram(program);

  const frame_buffer = gl.createFramebuffer();
  if (!frame_buffer) {
    console.error("Failed to create frame buffer.");
    return false;
  }

  const geometry_buffer = gl.createBuffer();
  if (!geometry_buffer) {
    console.error("Failed to create WebGL buffer.");
    return false;
  }

  const [_viewport_x, _viewport_y, viewport_width, viewport_height] = gl.getParameter(gl.VIEWPORT);
  if (viewport_width != viewport_height) {
    console.error(`Expected viewport to be square but it's ${viewport_width}x${viewport_height}.`);
    return false;
  }

  // These we set only once.
  gl.uniform1i(uniform_location(gl, program, "texture_0"), 0);
  gl.uniform1i(uniform_location(gl, program, "texture_1"), 1);
  gl.uniform1f(uniform_location(gl, program, "cell_size"), 1 / viewport_width);
  gl.uniform1f(uniform_location(gl, program, "dt"), 1 / 60);

  // These we'll be reusing.
  const diffusion_rate_uniform = uniform_location(gl, program, "diffusion_rate");
  const dissipation_rate_uniform = uniform_location(gl, program, "dissipation_rate");
  const pass_kind_uniform = uniform_location(gl, program, "pass_kind");

  debug_assert_ok(gl);

  // We'll be rendering two triangles that cover the entire viewport.
  const triangles = new Float32Array([
    -1, -1,
    -1, +1,
    +1, -1,

    +1, -1,
    -1, +1,
    +1, +1,
  ]);

  gl.bindBuffer(gl.ARRAY_BUFFER, geometry_buffer);
  gl.bufferData(gl.ARRAY_BUFFER, triangles, gl.STATIC_DRAW);
  debug_assert_ok(gl);

  const position_attribute = attribute_location(gl, program, "position");
  gl.enableVertexAttribArray(position_attribute);
  gl.vertexAttribPointer(position_attribute, 2, gl.FLOAT, false, 0, 0);
  debug_assert_ok(gl);

  const zeroed_pixels = new Float32Array(viewport_width * viewport_height * 4);
  const blank_texture = new_rgba_float_texture(gl, viewport_width, viewport_height, zeroed_pixels);
  const texture_0 = new_rgba_float_texture(gl, viewport_width, viewport_height, zeroed_pixels);
  const texture_1 = new_rgba_float_texture(gl, viewport_width, viewport_height, zeroed_pixels);
  const texture_2 = new_rgba_float_texture(gl, viewport_width, viewport_height, zeroed_pixels);
  const texture_3 = new_rgba_float_texture(gl, viewport_width, viewport_height, zeroed_pixels);
  if (!blank_texture || !texture_0 || !texture_1 || !texture_2 || !texture_3) {
    console.error("Failed to initialize textures.");
    return false;
  }

  function draw_pass(
    pass_kind: PassKind,
    input_0: WebGLTexture,
    input_1: WebGLTexture | null,
    output: WebGLTexture | null) {

    gl.uniform1i(pass_kind_uniform, pass_kind);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, input_0);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, input_1);

    if (output) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, frame_buffer);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, output, 0);
    }
    else {
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }

    gl.drawArrays(gl.TRIANGLES, 0, 6);
    debug_assert_ok(gl);
  }

  function copy(from: WebGLTexture, to: WebGLTexture) {
    draw_pass(PassKind.Copy, from, null, to);
  }

  function add_density_sources(input_flow: WebGLTexture, source: WebGLTexture, output_flow: WebGLTexture,) {
    gl.uniform1f(dissipation_rate_uniform, options.density_dissipation_rate);
    draw_pass(PassKind.DensitySource, input_flow, source, output_flow);
  }

  function diffuse_density(input_flow: WebGLTexture, intermediate: WebGLTexture, output_flow: WebGLTexture) {
    copy(input_flow, intermediate);

    gl.uniform1f(diffusion_rate_uniform, options.density_diffusion_rate);

    let iteration_input = input_flow;
    let iteration_output = output_flow;

    for (let i = 0; i < options.nr_intermediate_iterations; ++i) {
      draw_pass(PassKind.DensityDiffusion, iteration_input, intermediate, iteration_output);
      [iteration_input, iteration_output] = [iteration_output, iteration_input]
    }
    // Swap back after the last iteration.
    [iteration_input, iteration_output] = [iteration_output, iteration_input]

    // Ensure that at loop end the output texture contains the last iteration's output.
    if (iteration_output != output_flow) {
      copy(iteration_output, output_flow);
    }
  }

  function advect_density(input_flow: WebGLTexture, output_flow: WebGLTexture) {
    draw_pass(PassKind.DensityAdvection, input_flow, null, output_flow);
  }

  function add_velocity_sources(input_flow: WebGLTexture, source: WebGLTexture, output_flow: WebGLTexture,) {
    gl.uniform1f(dissipation_rate_uniform, options.velocity_dissipation_rate);
    draw_pass(PassKind.VelocitySource, input_flow, source, output_flow);
  }

  function diffuse_velocity(input_flow: WebGLTexture, intermediate: WebGLTexture, output_flow: WebGLTexture) {
    copy(input_flow, intermediate);

    gl.uniform1f(diffusion_rate_uniform, options.velocity_diffusion_rate);

    let iteration_input = input_flow;
    let iteration_output = output_flow;

    for (let i = 0; i < options.nr_intermediate_iterations; ++i) {
      draw_pass(PassKind.VelocityDiffusion, iteration_input, intermediate, iteration_output);
      [iteration_input, iteration_output] = [iteration_output, iteration_input]
    }
    // Swap back after the last iteration.
    [iteration_input, iteration_output] = [iteration_output, iteration_input]

    // Ensure that at loop end the output texture contains the last iteration's output.
    if (iteration_output != output_flow) {
      copy(iteration_output, output_flow);
    }
  }

  function advect_velocity(input_flow: WebGLTexture, output_flow: WebGLTexture) {
    draw_pass(PassKind.VelocityAdvection, input_flow, null, output_flow);
  }

  function project_velocity(input_flow: WebGLTexture, intermediate: WebGLTexture, output_flow: WebGLTexture) {
    draw_pass(PassKind.VelocityProjectionStep1, input_flow, null, intermediate);

    let iteration_input = intermediate;
    let iteration_output = output_flow;

    for (let i = 0; i < options.nr_intermediate_iterations; ++i) {
      draw_pass(PassKind.VelocityProjectionStep2, iteration_input, null, iteration_output);
      [iteration_input, iteration_output] = [iteration_output, iteration_input]
    }
    // Swap back after the last iteration.
    [iteration_input, iteration_output] = [iteration_output, iteration_input]

    // Ensure that at loop end the intermediate texture contains the last iteration's output.
    if (iteration_output != intermediate) {
      copy(iteration_output, intermediate);
    }

    draw_pass(PassKind.VelocityProjectionStep3, input_flow, intermediate, output_flow);
  }

  function visualize(flow: WebGLTexture) {
    draw_pass(PassKind.Visualization, flow, null, null);
  }

  // We'll be swapping these throughout. Using the output of one draw pass as input to the next.
  let input_flow = texture_0;
  let output_flow = texture_1;
  function swap_input_and_output() { [input_flow, output_flow] = [output_flow, input_flow]; }

  const source_flow = texture_2;
  const intermediate = texture_3;

  const source_brush_pixels = new Float32Array(brush_size * brush_size * 4);

  const fps_element = document.getElementById("fps");
  const fps_stats = (show_fps && fps_element) ? {
    previous_frame_time: Date.now(),
    recent_frame_rates: new Array<number>(60),
    next_frame_rate_index: 0,
    element: fps_element
  } : null;

  const step_simulation = () => {

    copy(blank_texture, source_flow);

    if (flow_source.position && (flow_source.density > 0 || flow_source.needs_movement_processing)) {
      const region_x = Math.max(0, flow_source.position.x - brush_radius);
      const region_y = Math.max(0, flow_source.position.y - brush_radius);
      const region_width = Math.min(viewport_width - region_x, brush_size);
      const region_height = Math.min(viewport_height - region_y, brush_size);
      set_brush_pixels(source_brush_pixels, flow_source.velocity.x, flow_source.velocity.y, flow_source.density);
      update_sub_image(gl, source_flow, region_x, region_y, region_width, region_height, source_brush_pixels);
      flow_source.needs_movement_processing = false;
    }

    add_velocity_sources(input_flow, source_flow, output_flow);
    swap_input_and_output();

    diffuse_velocity(input_flow, intermediate, output_flow);
    swap_input_and_output();

    project_velocity(input_flow, intermediate, output_flow);
    swap_input_and_output();

    advect_velocity(input_flow, output_flow);
    swap_input_and_output();

    project_velocity(input_flow, intermediate, output_flow);
    swap_input_and_output();

    add_density_sources(input_flow, source_flow, output_flow);
    swap_input_and_output();

    diffuse_density(input_flow, intermediate, output_flow);
    swap_input_and_output();

    advect_density(input_flow, output_flow);
    visualize(output_flow);
    swap_input_and_output();

    if (fps_stats) {
      const this_frame_time = Date.now();
      const fps = 1000 / (this_frame_time - fps_stats.previous_frame_time);
      fps_stats.previous_frame_time = this_frame_time;

      fps_stats.recent_frame_rates[fps_stats.next_frame_rate_index] = fps;
      fps_stats.next_frame_rate_index += 1;
      fps_stats.next_frame_rate_index %= fps_stats.recent_frame_rates.length;

      if (fps_stats.next_frame_rate_index == 0) {
        const average_fps =
          fps_stats.recent_frame_rates.reduce((sum, item) => sum + item) /
          fps_stats.recent_frame_rates.length;
        fps_stats.element.textContent = `FPS: ${Math.floor(average_fps)}`;
      }
    }

    requestAnimationFrame(step_simulation);
  }

  requestAnimationFrame(step_simulation);
  return true;
}

function inject_initial_flow(
  flow_source: FlowSource,
  center_x: number, center_y: number,
  radius: number, nr_puffs: number,
  density: number, velocity: number,
  total_duration_ms: number): Promise<void> {
  return new Promise(resolve => {
    function inject_puff(index: number) {
      const angle = 2 * Math.PI / nr_puffs * index;
      flow_source.position = {
        x: center_x + Math.cos(angle) * radius,
        y: center_y + Math.sin(angle) * radius,
      };
      flow_source.velocity = {
        x: Math.cos(angle) * velocity,
        y: Math.sin(angle) * velocity,
      };
      flow_source.density = density;

      if (index + 1 < nr_puffs) {
        setTimeout(() => inject_puff(index + 1), total_duration_ms / nr_puffs)
      }
      else {
        flow_source.density = 0;
        resolve();
      }
    }
    inject_puff(0);
  });
}

function setup_user_flow_source(flow_source: FlowSource, canvas: HTMLCanvasElement) {
  const pointer_position = (event: PointerEvent) => {
    // Flip Y to match WebGL texture convention where zero is at the bottom.
    return {
      x: event.clientX - canvas.offsetLeft,
      y: canvas.clientHeight - (event.clientY - canvas.offsetTop)
    };
  }
  canvas.addEventListener("pointerdown", event => {
    flow_source.position = pointer_position(event);
    flow_source.density = 50;
    canvas.setPointerCapture(event.pointerId);
  });
  canvas.addEventListener("pointerup", event => {
    flow_source.density = 0;
    canvas.releasePointerCapture(event.pointerId);
  });
  canvas.addEventListener("pointermove", event => {
    const previous_position = Object.assign(pointer_position(event), flow_source.position);
    flow_source.position = pointer_position(event);
    flow_source.velocity.x = flow_source.position.x - previous_position.x;
    flow_source.velocity.y = flow_source.position.y - previous_position.y;
    flow_source.needs_movement_processing = true;
  });
}

function setup(): boolean {
  const canvas = document.getElementById("demo-canvas");
  if (!(canvas instanceof HTMLCanvasElement)) {
    console.error(`Expected a canvas element but got ${typeof canvas} instead.`);
    return false;
  }

  // Match resolution to occupied space.
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;

  const gl = canvas.getContext("webgl", { alpha: false });
  if (!gl) {
    console.error("Failed to get WebGL rendering context.");
    return false;
  }

  for (const extension of ["OES_texture_float", "WEBGL_color_buffer_float"]) {
    if (!gl.getExtension(extension)) {
      console.error(`Required WebGL extension '${extension}' is unsupported.`);
      return false;
    }
  }

  gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);

  const vertex_shader = compiled_shader_from_source(gl, vertex_shader_source, gl.VERTEX_SHADER);
  if (!vertex_shader) {
    console.error("Failed to compile vertex shader.");
    return false;
  }

  const fragment_shader = compiled_shader_from_source(gl, fragment_shader_source, gl.FRAGMENT_SHADER);
  if (!fragment_shader) {
    console.error("Failed to compile fragment shader.");
    return false;
  }

  const program = gl.createProgram();
  if (!program) {
    console.error("Failed to create WebGL program.");
    return false;
  }

  gl.attachShader(program, vertex_shader);
  gl.attachShader(program, fragment_shader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error(`Failed to link WebGL program: ${gl.getProgramInfoLog(program)}`);
    return false;
  }

  debug_assert_ok(gl);

  const flow_source: FlowSource = {
    position: null,
    velocity: { x: 0, y: 0 },
    density: 0,
    needs_movement_processing: false,
  };
  const options: SimulationOptions = {
    density_diffusion_rate: 0.00001,
    density_dissipation_rate: 0.01,
    velocity_diffusion_rate: 0,
    velocity_dissipation_rate: 0.0001,
    nr_intermediate_iterations: 20,
  };

  if (!begin_simulation(gl, program, flow_source, options)) {
    console.error("Simulation aborted.");
    return false;
  }

  inject_initial_flow(
    flow_source, canvas.width / 2, canvas.height / 2,
    /* radius: */ canvas.width / 10,
    /* nr. puffs: */ 30,
    /* density: */ 100,
    /* velocity: */ 10,
    /* duration ms: */ 1000)
    .then(() => setup_user_flow_source(flow_source, canvas));

  console.log("Simulation started.")
  return true;
}

window.addEventListener("DOMContentLoaded", setup, { once: true });
