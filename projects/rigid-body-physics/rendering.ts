import { World } from "./simulation";

export type EntityStyles = {
  [key: number]: { fill: string };
};

export type AnimationControls = {
  pause(): void;
  resume(): void;
};

function render_world_frame(
  world: World,
  context: CanvasRenderingContext2D,
  entity_styles: EntityStyles
) {
  context.save();

  // Clear canvas.
  context.fillStyle = "white";
  context.fillRect(0, 0, context.canvas.width, context.canvas.height);

  // Flip vertical axis.
  context.translate(0, context.canvas.height);
  context.scale(1, -1);

  // Scale to world size.
  context.scale(
    context.canvas.width / world.options.size,
    context.canvas.height / world.options.size
  );

  // Draw entities.
  for (const entity_id in entity_styles) {
    const { fill } = entity_styles[entity_id];
    const entity = world.entity(parseInt(entity_id));
    context.beginPath();
    context.arc(
      entity.position.x,
      entity.position.y,
      entity.radius,
      0,
      2 * Math.PI
    );
    context.fillStyle = fill;
    context.fill();
  }

  context.restore();
}

export function render_world_animation(
  world: World,
  context: CanvasRenderingContext2D,
  entity_styles: EntityStyles,
  frame_callback?: () => void
): AnimationControls {
  // Frame request loop.
  let frame_request: number | null = null;
  let last_frame_time: number | null = null;
  function on_animation_frame() {
    const now = performance.now();
    const real_dt =
      last_frame_time !== null ? (now - last_frame_time) / 1000 : 1 / 60;
    last_frame_time = now;
    world.step(real_dt);
    render_world_frame(
      world,
      context as CanvasRenderingContext2D,
      entity_styles
    );
    if (frame_callback) {
      frame_callback();
    }
    if (frame_request !== null) {
      frame_request = requestAnimationFrame(on_animation_frame);
    }
  }

  // Start animation.
  frame_request = requestAnimationFrame(on_animation_frame);

  return {
    pause() {
      if (frame_request !== null) {
        cancelAnimationFrame(frame_request);
        frame_request = null;
        last_frame_time = null;
      }
    },
    resume() {
      if (frame_request === null) {
        last_frame_time = performance.now();
        frame_request = requestAnimationFrame(on_animation_frame);
      }
    },
  };
}
