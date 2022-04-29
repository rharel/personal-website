import { advance, CellCoords, WorldState } from "./game_of_life";

function draw_world_state(
  context: CanvasRenderingContext2D,
  world_state: WorldState,
  change_coords?: CellCoords[]
) {
  const cell_size = context.canvas.width / world_state.width;

  if (change_coords !== undefined) {
    for (const { x, y } of change_coords) {
      let rect_offset;
      let rect_size;
      if (world_state.get(x, y)) {
        rect_offset = 0;
        rect_size = cell_size;
      } else {
        rect_offset = -1;
        rect_size = cell_size + 2;
      }
      context.fillStyle = world_state.get(x, y) ? "black" : "white";
      context.fillRect(
        x * cell_size + rect_offset,
        y * cell_size + rect_offset,
        rect_size,
        rect_size
      );
    }
  } else {
    context.fillStyle = "white";
    context.fillRect(0, 0, context.canvas.width, context.canvas.height);

    context.fillStyle = "black";
    for (let x = 0; x < world_state.width; x += 1) {
      for (let y = 0; y < world_state.height; y += 1) {
        if (world_state.get(x, y)) {
          context.fillRect(x * cell_size, y * cell_size, cell_size, cell_size);
        }
      }
    }
  }
}

function animate(
  context: CanvasRenderingContext2D,
  initial_state: WorldState,
  fps: number
) {
  let current_state = initial_state;
  let future_state = new WorldState(current_state.width, current_state.height);
  draw_world_state(context, current_state);

  let paused = false;

  function draw_frame() {
    const change_coords = advance(current_state, future_state);
    draw_world_state(context, future_state, change_coords);

    const buffer = current_state;
    current_state = future_state;
    future_state = buffer;

    if (!paused) {
      setTimeout(() => {
        requestAnimationFrame(draw_frame);
      }, 1000 / fps);
    }
  }

  setTimeout(() => {
    requestAnimationFrame(draw_frame);
  }, 1000 / fps);

  function toggle_pause() {
    paused = !paused;
    if (!paused) {
      setTimeout(() => {
        requestAnimationFrame(draw_frame);
      }, 1000 / fps);
    }
  }
  return toggle_pause;
}

function setup() {
  const canvas = document.getElementById("demo-canvas");
  if (!(canvas instanceof HTMLCanvasElement)) {
    throw new Error(`expected canvas element, found ${typeof canvas}`);
  }

  const context = canvas.getContext("2d", { alpha: false });
  if (context === null) {
    throw new Error("cannot get rendering context");
  }

  const initial_state = new WorldState(44, 44);
  const pattern_offset_x = 4;
  const pattern_offset_y = 6;
  const glider_gun_pattern = [
    "........................O",
    "......................O.O",
    "............OO......OO............OO",
    "...........O...O....OO............OO",
    "OO........O.....O...OO",
    "OO........O...O.OO....O.O",
    "..........O.....O.......O",
    "...........O...O",
    "............OO",
  ];
  for (let y = 0; y < glider_gun_pattern.length; y += 1) {
    const row = glider_gun_pattern[y];
    for (let x = 0; x < row.length; x += 1) {
      if (row[x] !== ".") {
        initial_state.set(x + pattern_offset_x, y + pattern_offset_y, true);
      }
    }
  }

  const toggle_pause = animate(context, initial_state, 30);

  document
    .getElementById("demo-toggle-pause-button")
    ?.addEventListener("click", toggle_pause);
}

window.addEventListener("DOMContentLoaded", setup);
