import {
  GameState,
  game_ended,
  new_game_state,
  next_game_state as next_game_state,
  winner,
} from "./pong";

type RenderOptions = {
  background_color: string;
  foreground_color: string;
};

function draw_game_state(
  game_state: GameState,
  context: CanvasRenderingContext2D,
  options: RenderOptions
) {
  context.fillStyle = options.background_color;
  context.fillRect(0, 0, context.canvas.width, context.canvas.height);

  context.save();

  context.scale(context.canvas.width / 2, context.canvas.height / 2);
  context.translate(1, 1);

  context.fillStyle = options.foreground_color;
  context.beginPath();
  context.rect(
    game_state.player_paddle_x - game_state.paddle_width * 0.5,
    1 - game_state.paddle_height,
    game_state.paddle_width,
    game_state.paddle_height
  );
  context.rect(
    game_state.ai_paddle_x - game_state.paddle_width * 0.5,
    -1,
    game_state.paddle_width,
    game_state.paddle_height
  );
  context.arc(
    game_state.ball_position.x,
    game_state.ball_position.y,
    game_state.ball_radius,
    0,
    2 * Math.PI
  );
  context.fill();

  context.restore();
}

function setup() {
  const canvas = document.getElementById("demo-canvas");
  if (!(canvas instanceof HTMLCanvasElement)) {
    throw new Error("cannot find canvas");
  }

  const render_context = canvas.getContext("2d", { alpha: false });
  if (render_context === null) {
    throw new Error("cannot get context");
  }

  const game_options = {
    ball_radius: 0.05,
    ball_initial_speed: 1.6,
    ball_max_bounce_angle: 0.3 * Math.PI,
    paddle_width: 0.4,
    paddle_height: 0.05,
    ai_movement_speed: 1,
  };
  const render_options = {
    background_color: "white",
    foreground_color: "#ed12a5",
  };

  let game_state = new_game_state(game_options);
  let last_frame_time_ms: number | null = null;

  canvas.addEventListener("mousemove", (event) => {
    game_state.player_paddle_x = -1 + (event.offsetX / canvas.clientWidth) * 2;
  });

  const advance_game = () => {
    const this_frame_time_ms = performance.now();
    const elapsed_seconds = last_frame_time_ms
      ? (this_frame_time_ms - last_frame_time_ms) / 1000
      : 0;
    last_frame_time_ms = this_frame_time_ms;
    game_state = next_game_state(game_state, elapsed_seconds);
    draw_game_state(game_state, render_context, render_options);
    if (game_ended(game_state)) {
      if (
        winner(game_state) === "player" &&
        game_options.ball_initial_speed < 3
      ) {
        game_options.ball_initial_speed += 0.2;
        game_options.ai_movement_speed += 0.2;
      }
      game_state = new_game_state(game_options);
      last_frame_time_ms = null;
      setTimeout(() => requestAnimationFrame(advance_game), 1000);
    } else {
      requestAnimationFrame(advance_game);
    }
  };
  advance_game();
}

window.addEventListener("DOMContentLoaded", setup);
