import { EntityStyles, render_world_animation } from "./rendering";
import { World } from "./simulation";
import { Vec2 } from "./geometry";

const WORLD_SIZE = 1;
const NR_PARTICLES = 50;
const PARTICLE_ENTITY_RADIUS_MIN = (0.02 * WORLD_SIZE * 30) / NR_PARTICLES;
const PARTICLE_ENTITY_RADIUS_MAX = (0.05 * WORLD_SIZE * 30) / NR_PARTICLES;
const PARTICLE_VELOCITY_MIN = 0.1 * WORLD_SIZE;
const PARTICLE_VELOCITY_MAX = 0.5 * WORLD_SIZE;
const PARTICLE_ELASTICITY = 0.95;
const PALETTE = [
  "red",
  "blue",
  "brown",
  "green",
  "orange",
  "magenta",
  "purple",
];

function random_in_range(lower: number, upper: number): number {
  return lower + Math.random() * (upper - lower);
}

function setup() {
  const entity_styles: EntityStyles = {};

  const world = new World({
    size: WORLD_SIZE,
    collision_culling_subdivisions: 3,
    high_precision: true,
  });

  for (let i = 0; i < NR_PARTICLES; ++i) {
    const radius = random_in_range(
      PARTICLE_ENTITY_RADIUS_MIN,
      PARTICLE_ENTITY_RADIUS_MAX
    );
    const mass = Math.PI * radius * radius;
    const particle_id = world.spawn({
      mass,
      radius,
      elasticity: PARTICLE_ELASTICITY,
      position: {
        x: random_in_range(radius, world.options.size - radius),
        y: random_in_range(radius, world.options.size - radius),
      },
      velocity: new Vec2(
        random_in_range(-1, 1),
        random_in_range(-1, 1)
      ).set_length(
        random_in_range(PARTICLE_VELOCITY_MIN, PARTICLE_VELOCITY_MAX)
      ),
    });
    entity_styles[particle_id] = { fill: PALETTE[i % PALETTE.length] };
  }

  const canvas_elements = document.getElementsByClassName("demo-canvas");
  if (canvas_elements.length !== 1) {
    throw new Error(`expected 1 demo canvas, found ${canvas_elements.length}`);
  }

  const canvas = canvas_elements.item(0);
  if (!(canvas instanceof HTMLCanvasElement)) {
    throw new Error(`expected canvas element, found ${typeof canvas}`);
  }

  const context = canvas.getContext("2d", { alpha: false });
  if (context === null) {
    throw new Error("cannot get rendering context");
  }

  const controls = render_world_animation(
    world,
    context,
    "white",
    entity_styles,
    () => {
      let total_velocity = 0;
      world.for_each_entity((entity_id, entity) => {
        let update_required = false;
        if (entity.position.x < entity.radius) {
          entity.position.x = entity.radius;
          entity.velocity.x *= -1;
          update_required = true;
        }
        if (entity.position.x > world.options.size - entity.radius) {
          entity.position.x = world.options.size - entity.radius;
          entity.velocity.x *= -1;
          update_required = true;
        }
        if (entity.position.y < entity.radius) {
          entity.position.y = entity.radius;
          entity.velocity.y *= -1;
          update_required = true;
        }
        if (entity.position.y > world.options.size - entity.radius) {
          entity.position.y = world.options.size - entity.radius;
          entity.velocity.y *= -1;
          update_required = true;
        }
        if (update_required) {
          world.update(entity_id, {
            position: entity.position,
            velocity: entity.velocity,
          });
        }
        total_velocity += entity.velocity.x + entity.velocity.y;
      });
      if (total_velocity === 0) {
        controls.pause();
      }
    }
  );
}

window.addEventListener("DOMContentLoaded", setup);
