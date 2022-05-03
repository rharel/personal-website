function clamp(value: number, min: number, max: number): number {
  return value < min ? min : value > max ? max : value;
}

class Vec2 {
  constructor(public x: number, public y: number) {}

  clamp(min: Vec2, max: Vec2): Vec2 {
    return new Vec2(clamp(this.x, min.x, max.x), clamp(this.y, min.y, max.y));
  }

  distance_squared_to(other: Vec2): number {
    return (
      (this.x - other.x) * (this.x - other.x) +
      (this.y - other.y) * (this.y - other.y)
    );
  }

  magnitude(): number {
    return Math.sqrt(this.distance_squared_to(new Vec2(0, 0)));
  }

  normalized(): Vec2 {
    return new Vec2(this.x / this.magnitude(), this.y / this.magnitude());
  }

  plus(other: Vec2): Vec2 {
    return new Vec2(this.x + other.x, this.y + other.y);
  }

  times(scalar: number): Vec2 {
    return new Vec2(this.x * scalar, this.y * scalar);
  }
}

export type GameOptions = {
  ball_radius: number;
  ball_initial_speed: number;
  ball_max_bounce_angle: number;
  paddle_width: number;
  paddle_height: number;
  ai_movement_speed: number;
};

// The table is a square with size 2 centered at (0, 0).
export type GameState = GameOptions & {
  ball_position: Vec2;
  ball_velocity: Vec2;
  player_paddle_x: number;
  ai_paddle_x: number;
};

export function new_game_state(options: GameOptions): GameState {
  return {
    ball_position: new Vec2(0, 0),
    ball_velocity: new Vec2(0, options.ball_initial_speed),
    player_paddle_x: 0,
    ai_paddle_x: 0,
    ...options,
  };
}

export function next_game_state(
  previous_state: GameState,
  elapsed_time: number
): GameState {
  if (game_ended(previous_state)) {
    return previous_state;
  }

  const {
    ball_radius,
    ball_max_bounce_angle,
    paddle_width,
    paddle_height,
    ai_movement_speed,
  } = previous_state;
  let ball_state = {
    position: previous_state.ball_position.plus(
      previous_state.ball_velocity.times(elapsed_time)
    ),
    velocity: previous_state.ball_velocity,
  };
  ball_state = handle_ball_collision_with_paddle(
    ball_radius,
    ball_max_bounce_angle,
    ball_state.position,
    ball_state.velocity,
    previous_state.player_paddle_x,
    1 - previous_state.paddle_height * 0.5,
    paddle_width,
    paddle_height
  );
  ball_state = handle_ball_collision_with_paddle(
    ball_radius,
    ball_max_bounce_angle,
    ball_state.position,
    ball_state.velocity,
    previous_state.ai_paddle_x,
    -1 + previous_state.paddle_height * 0.5,
    paddle_width,
    paddle_height
  );
  ball_state = handle_ball_collision_with_walls(
    ball_radius,
    ball_state.position,
    ball_state.velocity
  );

  return {
    ...previous_state,
    ball_position: ball_state.position,
    ball_velocity: ball_state.velocity,
    ai_paddle_x:
      previous_state.ai_paddle_x +
      elapsed_time *
        ai_paddle_velocity(
          ball_radius,
          ball_max_bounce_angle,
          ball_state.position,
          ball_state.velocity,
          previous_state.player_paddle_x,
          previous_state.ai_paddle_x,
          paddle_width,
          paddle_height,
          ai_movement_speed
        ),
  };
}

export function game_ended(state: GameState): boolean {
  return winner(state) !== null;
}

export function winner(state: GameState): "player" | "ai" | null {
  return state.ball_position.y - state.ball_radius < -1
    ? "player"
    : state.ball_position.y + state.ball_radius > 1
    ? "ai"
    : null;
}

type BallState = {
  position: Vec2;
  velocity: Vec2;
};

function handle_ball_collision_with_paddle(
  ball_radius: number,
  ball_max_bounce_radians: number,
  ball_position: Vec2,
  ball_velocity: Vec2,
  paddle_x: number,
  paddle_y: number,
  paddle_width: number,
  paddle_height: number
): BallState {
  const paddle_left = paddle_x - paddle_width * 0.5;
  const paddle_right = paddle_x + paddle_width * 0.5;
  const paddle_bottom = paddle_y - paddle_height * 0.5;
  const paddle_top = paddle_y + paddle_height * 0.5;

  const nearest_paddle_point = ball_position.clamp(
    new Vec2(paddle_left, paddle_bottom),
    new Vec2(paddle_right, paddle_top)
  );
  const collides =
    ball_position.distance_squared_to(nearest_paddle_point) <
    ball_radius * ball_radius;

  if (!collides) {
    return { position: ball_position, velocity: ball_velocity };
  }

  // When there is a collision, separate the ball from the paddle.

  const separation_padding = 0.001;
  const separation_y =
    ball_velocity.y < 0
      ? paddle_top + ball_radius + separation_padding
      : paddle_bottom - ball_radius - separation_padding;

  const separation_direction = ball_velocity.normalized();
  separation_direction.y *= -1;

  const separation_distance = Math.abs(
    (ball_position.y - separation_y) / separation_direction.y
  );
  const new_ball_position = ball_position.plus(
    separation_direction.times(separation_distance)
  );

  // Once the ball is separated, calculate its new velocity after it bounces.

  const center_offset = new_ball_position.x - paddle_x;
  const center_offset_normalized = center_offset / (0.5 * paddle_width);
  const bounce_angle =
    0.5 * Math.PI - center_offset_normalized * ball_max_bounce_radians;
  const new_ball_velocity = new Vec2(
    Math.cos(bounce_angle),
    -Math.sign(ball_velocity.y) * Math.sin(bounce_angle)
  ).times(ball_velocity.magnitude());

  return {
    position: new_ball_position,
    velocity: new_ball_velocity,
  };
}

function handle_ball_collision_with_walls(
  radius: number,
  position: Vec2,
  velocity: Vec2
): BallState {
  if (position.x - radius < -1) {
    return {
      position: new Vec2(-1 + radius, position.y),
      velocity: new Vec2(velocity.x * -1, velocity.y),
    };
  } else if (position.x + radius > 1) {
    return {
      position: new Vec2(1 - radius, position.y),
      velocity: new Vec2(velocity.x * -1, velocity.y),
    };
  } else {
    return { position, velocity };
  }
}

function ai_paddle_velocity(
  ball_radius: number,
  ball_max_bounce_angle: number,
  ball_position: Vec2,
  ball_velocity: Vec2,
  player_paddle_x: number,
  ai_paddle_x: number,
  paddle_width: number,
  paddle_height: number,
  max_velocity: number
): number {
  if (ball_velocity.y >= 0) {
    return 0;
  }

  const goal_y = Math.sign(ball_velocity.y);
  const wall_ahead_x = Math.sign(ball_velocity.x);
  const wall_behind_x = -wall_ahead_x;

  const time_to_intercept =
    (Math.abs(goal_y - ball_position.y) - paddle_height - ball_radius) /
    Math.abs(ball_velocity.y);

  const horizontal_movement = Math.abs(ball_velocity.x * time_to_intercept);
  const distance_to_wall_ahead =
    Math.abs(wall_ahead_x - ball_position.x) - ball_radius;

  let intercept_x;
  if (horizontal_movement < distance_to_wall_ahead) {
    intercept_x = ball_position.x + ball_velocity.x * time_to_intercept;
  } else {
    const padded_edge_size = 2 - 2 * ball_radius;
    const nr_wall_bounces = Math.floor(
      (horizontal_movement - distance_to_wall_ahead) / padded_edge_size
    );
    const final_stretch_distance =
      (horizontal_movement - distance_to_wall_ahead) % padded_edge_size;
    intercept_x =
      nr_wall_bounces % 2 == 0
        ? wall_ahead_x - Math.sign(ball_velocity.x) * final_stretch_distance
        : wall_behind_x + Math.sign(ball_velocity.x) * final_stretch_distance;
  }

  const target_serve_x = -Math.sign(player_paddle_x) * (1 - ball_radius);
  const target_bounce_angle = Math.atan((target_serve_x - intercept_x) / 2);
  const center_offset_normalized = target_bounce_angle / ball_max_bounce_angle;
  const center_offset =
    clamp(center_offset_normalized, -1, 1) * 0.5 * paddle_width;
  const target_x = intercept_x - center_offset;
  const target_dx = target_x - ai_paddle_x;

  return max_velocity * target_dx;
}
