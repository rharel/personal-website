import { discs_intersect, Vec2 } from "./geometry";
import { Entity } from "./simulation";
import { BoundingBox, QuadTree } from "./quadtree";

export type CullingOptions = {
  bounds_size: number;
  subdivisions: number;
};

export default class CollisionCuller {
  constructor(readonly options: CullingOptions) {
    this.quadtree = new QuadTree(
      options.subdivisions,
      new BoundingBox(
        options.bounds_size,
        0,
        options.bounds_size,
        options.bounds_size
      )
    );
  }

  clear() {
    this.quadtree.clear();
  }

  add(entity: Entity) {
    this.quadtree.add(
      entity,
      BoundingBox.from_center_and_radius(
        entity.position.x,
        entity.position.y,
        entity.radius
      )
    );
  }

  remove(entity: Entity) {
    this.quadtree.remove(
      entity,
      BoundingBox.from_center_and_radius(
        entity.position.x,
        entity.position.y,
        entity.radius
      )
    );
  }

  moved(entity: Entity, old_position: Vec2) {
    const old_bounds = BoundingBox.from_center_and_radius(
      old_position.x,
      old_position.y,
      entity.radius
    );
    const new_bounds = BoundingBox.from_center_and_radius(
      entity.position.x,
      entity.position.y,
      entity.radius
    );
    this.quadtree.remove(entity, old_bounds);
    this.quadtree.add(entity, new_bounds);
  }

  for_each_potential_collision_group(callback: (group: Array<Entity>) => void) {
    this.quadtree.for_each_leaf_with_at_least(2, (items) => {
      callback(items);
    });
  }

  private readonly quadtree: QuadTree<Entity>;
}

// Finds roots of a quadratic.
function quadratic_solution(
  a: number,
  b: number,
  c: number
):
  | { count: 2; x1: number; x2: number }
  | { count: 1; x1: number }
  | { count: 0 } {
  const b2_4ac = b * b - 4 * a * c;
  if (b2_4ac < 0) {
    return { count: 0 };
  } else if (b2_4ac > 0) {
    return {
      count: 2,
      x1: (-b + Math.sqrt(b2_4ac)) / (2 * a),
      x2: (-b - Math.sqrt(b2_4ac)) / (2 * a),
    };
  } else {
    return { count: 1, x1: -b / (2 * a) };
  }
}

// Tests whether two discs with the specified velocities collide in the near future.
//
// c1, v1, r1:
//      The first disc's center, velocity, and radius.
// c2, v2, r2:
//      The second disc's center, velocity, and radius.
//
// Returns the time of collision or -1 if there is none.
function collision_time(
  c1: Vec2,
  v1: Vec2,
  r1: number,
  c2: Vec2,
  v2: Vec2,
  r2: number
): number {
  // The squared distance between the two centers at time t is:
  //
  // (1)  D(t) = |(c1 + v1 * t) - (c2 + v2 * t)| ^ 2
  //
  // We are interested in finding whether D(t) <= (r1 + r2) ^ 2 on the interval [0, dt].
  // This is equivalent to solving the following equation:
  //
  // (2)   ((c1.x + v1.x * t) - (c2.x + v2.x * t)) ^ 2 +
  //       ((c1.y + v1.y * t) - (c2.y + v2.y * t)) ^ 2 -
  //       (r1 + r2) ^ 2 <= 0
  //
  // Rewrite:
  //
  //      (c1.x - c2.x + (v1.x - v2.x) * t) ^ 2 +
  //      (c1.y - c2.y + (v1.y - v2.y) * t) ^ 2 -
  //      (r1 + r2) ^ 2 <= 0
  //
  // Denote the components of c1 - c2 = [dc_x, dc_y], those of v1 - v2 [dv_x, dv_y], and call
  // r1 + r2 = R:
  //
  //      (dc_x + dv_x * t) ^ 2 +
  //      (dc_y + dv_y * t) ^ 2 -
  //      R ^ 2 <= 0
  //
  // Rewrite:
  //
  //      dc_x^2 + 2*dc_x*dv_x*t + (dv_x^2)*(t^2) +
  //      dc_y^2 + 2*dc_y*dv_y*t + (dv_y^2)*(t^2) -
  //      R ^ 2 <= 0
  //
  // Which can be expressed as:
  //
  //      a*(t^2) + b*t + c <= 0
  //
  // Where:
  //
  //      a = dv_x^2 + dv_y^2
  //      b = 2 * (dc_x*dv_x + dc_y*dv_y)
  //      c = dc_x^2 + dc_y^2 - R^2
  //
  // Solving this yields at most two solutions. All we have to do next is take the minimum
  // of the two that is also contained within the interval [0, dt].

  const dv_x = v1.x - v2.x;
  const dv_y = v1.y - v2.y;

  const dv_x2 = dv_x * dv_x;
  const dv_y2 = dv_y * dv_y;

  const dc_x = c1.x - c2.x;
  const dc_y = c1.y - c2.y;

  const dc_x2 = dc_x * dc_x;
  const dc_y2 = dc_y * dc_y;

  const solution = quadratic_solution(
    dv_x2 + dv_y2,
    2 * (dc_x * dv_x + dc_y * dv_y),
    dc_x2 + dc_y2 - (r1 + r2) * (r1 + r2)
  );

  if (solution.count === 2) {
    const [t1, t2] =
      solution.x1 <= solution.x2
        ? [solution.x1, solution.x2]
        : [solution.x2, solution.x1];
    if (t1 < 0 && t2 >= 0) {
      return 0;
    }
    return t1;
  } else if (solution.count === 1) {
    return solution.x1;
  } else {
    return -1;
  }
}

export type Collision = {
  entities: [Entity, Entity];
  time: number;
};

// Finds near-future colliding pairs.
export function future_collisions(
  entities: Entity[],
  time_horizon: number
): Collision[] {
  let collisions: Collision[] = [];
  for (let j = 0; j < entities.length; ++j) {
    const a = entities[j];
    for (let k = j + 1; k < entities.length; ++k) {
      const b = entities[k];

      if (a.static && b.static) {
        continue;
      }

      const t = collision_time(
        a.position,
        a.velocity,
        a.radius,
        b.position,
        b.velocity,
        b.radius
      );

      if (0 <= t && t <= time_horizon) {
        collisions.push({
          entities: [a, b],
          time: t,
        });
      }
    }
  }
  return collisions;
}

// Finds colliding pairs.
export function present_collisions(entities: Entity[]): [Entity, Entity][] {
  const collisions: [Entity, Entity][] = [];
  for (let j = 0; j < entities.length; ++j) {
    const a = entities[j];
    for (let k = j + 1; k < entities.length; ++k) {
      const b = entities[k];

      if (a.static && b.static) {
        continue;
      }

      if (discs_intersect(a.position, a.radius, b.position, b.radius)) {
        collisions.push([a, b]);
        break;
      }
    }
  }
  return collisions;
}

// Applies collision response.
export function collide_entities(a: Entity, b: Entity) {
  if (a.static && b.static) {
    return;
  }

  // Ensure static entity is always assigned to a:
  if (b.static) {
    const c = a;
    a = b;
    b = c;
  }

  const dx = a.position
    .clone()
    .subtract(b.position)
    .set_length(a.radius + b.radius);
  const du = a.velocity.clone().subtract(b.velocity);

  const coefficient_of_restitution = 0.5 * (a.elasticity + b.elasticity);
  const response =
    (coefficient_of_restitution * 2 * du.dot(dx)) /
    ((a.mass + b.mass) * dx.length_squared());

  if (!a.static) {
    a.velocity.subtract(dx.clone().scale(response * b.mass));
  }
  if (!b.static) {
    b.velocity.subtract(dx.clone().scale(-response * a.mass));
  }
}

// Moves entities a minimum distance away from each other.
export function separate_entities(a: Entity, b: Entity, distance: number) {
  if (a.static && b.static) {
    return;
  }

  const r = a.radius + b.radius + distance;
  const d2 = a.position.distance_squared_to(b.position);

  if (d2 >= r * r) {
    return;
  }

  const collision_axis = a.position.clone().subtract(b.position).normalize();
  const offset_magnitude = r - Math.sqrt(d2);

  if (a.static) {
    b.position.add(collision_axis.scale(-offset_magnitude));
  } else if (b.static) {
    a.position.add(collision_axis.scale(offset_magnitude));
  } else {
    a.position.add(collision_axis.clone().scale(0.5 * offset_magnitude));
    b.position.add(collision_axis.clone().scale(0.5 * -offset_magnitude));
  }
}
