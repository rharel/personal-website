import { Vec2 } from "./geometry";
import CollisionCuller, {
  future_collisions,
  present_collisions,
  separate_entities,
  collide_entities,
  Collision,
} from "./collision";

// Mass of static entities. Should be extremely large.
const STATIC_ENTITY_MASS = Math.pow(10, 14);

// Minimum simulation time increment.
const MIN_TIME_STEP_SIZE = 0.001;

// Minimum distance between entities after collision separation.
const MIN_SEPARATION_DISTANCE = 0.001;

// Objects whose squared velocity is less than this are considered to be at rest.
const REST_VELOCITY_THRESHOLD = 0.001;

export type Entity = {
  mass: number;
  radius: number;
  elasticity: number;
  static: boolean;
  position: Vec2;
  velocity: Vec2;
  applied_force: Vec2;
};

export type EntityView = {
  mass: number;
  radius: number;
  elasticity: number;
  static: boolean;
  position: { x: number; y: number };
  velocity: { x: number; y: number };
  applied_force: { x: number; y: number };
};

export type EntityOptions = {
  [key in keyof EntityView]?: EntityView[key];
};

function step_entity(entity: Entity, dt: number) {
  const f = entity.applied_force;
  const m_inv = 1 / entity.mass;
  const p = entity.position;
  const v = entity.velocity;

  const a = 0.5 * dt * m_inv;
  p.x += dt * (v.x + a * f.x);
  p.y += dt * (v.y + a * f.y);

  const b = dt * m_inv;
  v.x += b * f.x;
  v.y += b * f.y;
}

export type WorldOptions = {
  size: number;
  collision_culling_subdivisions: number;
  high_precision: boolean;
};

export class World {
  constructor(readonly options: WorldOptions) {
    this.collision_culler = new CollisionCuller({
      subdivisions: options.collision_culling_subdivisions,
      bounds_size: options.size,
    });
  }

  clear() {
    this.collision_culler.clear();
    this.entities.clear();
  }

  spawn(options: EntityOptions): number {
    const entity = {
      mass: options.static
        ? STATIC_ENTITY_MASS
        : options.mass !== undefined
        ? options.mass
        : 1,
      radius: options.radius !== undefined ? options.radius : 1,
      elasticity: options.elasticity !== undefined ? options.elasticity : 0,
      static: options.static !== undefined ? options.static : false,
      position:
        options.position !== undefined
          ? new Vec2(options.position.x, options.position.y)
          : new Vec2(0, 0),
      velocity:
        options.velocity !== undefined
          ? new Vec2(options.velocity.x, options.velocity.y)
          : new Vec2(0, 0),
      applied_force:
        options.applied_force !== undefined
          ? new Vec2(options.applied_force.x, options.applied_force.y)
          : new Vec2(0, 0),
    };

    const id = this.next_entity_id;
    this.next_entity_id += 1;

    this.entities.set(id, entity);
    this.collision_culler.add(entity);

    return id;
  }

  remove(entity_id: number) {
    if (!this.entities.has(entity_id)) {
      throw new Error("bad entity id");
    }
    const entity = this.entities.get(entity_id) as Entity;
    this.collision_culler.remove(entity);
    this.entities.delete(entity_id);
  }

  entity(entity_id: number): EntityView {
    if (!this.entities.has(entity_id)) {
      throw new Error("bad entity id");
    }
    const entity = this.entities.get(entity_id) as Entity;
    return {
      ...entity,
      position: { x: entity.position.x, y: entity.position.y },
      velocity: { x: entity.velocity.x, y: entity.velocity.y },
      applied_force: { x: entity.applied_force.x, y: entity.applied_force.y },
    };
  }

  update(entity_id: number, options: EntityOptions) {
    if (!this.entities.has(entity_id)) {
      throw new Error("bad entity id");
    }

    const entity = this.entities.get(entity_id) as Entity;
    const old_position = entity.position.clone();

    if (options.mass !== undefined) {
      entity.mass = options.mass;
    }
    if (options.radius !== undefined) {
      entity.radius = options.radius;
    }
    if (options.elasticity !== undefined) {
      entity.elasticity = options.elasticity;
    }
    if (options.static !== undefined) {
      entity.static = options.static;
      if (entity.static) {
        entity.mass = STATIC_ENTITY_MASS;
      }
    }
    if (options.position !== undefined) {
      entity.position.x = options.position.x;
      entity.position.y = options.position.y;
    }
    if (options.velocity !== undefined) {
      entity.velocity.x = options.velocity.x;
      entity.velocity.y = options.velocity.y;
    }
    if (options.applied_force !== undefined) {
      entity.applied_force.x = options.applied_force.x;
      entity.applied_force.y = options.applied_force.y;
    }

    if (options.position !== undefined || options.radius !== undefined) {
      this.collision_culler.moved(entity, old_position);
    }
  }

  for_each_entity(callback: (id: number, entity: EntityView) => void) {
    this.entities.forEach((_entity, entity_id) => {
      callback(entity_id, this.entity(entity_id));
    });
  }

  step(dt: number) {
    if (dt <= 0) {
      throw new Error("cannot step with dt <= 0");
    }

    this.separate_colliding_entities();

    if (this.options.high_precision) {
      this.step_with_high_precision(dt);
    } else {
      this.step_with_low_precision(dt);
    }

    this.entities.forEach((entity) => {
      if (entity.velocity.length_squared() < REST_VELOCITY_THRESHOLD) {
        entity.velocity.x = 0;
        entity.velocity.y = 0;
      }
    });
  }

  private separate_colliding_entities() {
    const old_entity_positions = new Map<Entity, Vec2>();

    this.collision_culler.for_each_potential_collision_group((group) => {
      // Repeatedly find intersecting pairs, separate them, and check for new intersections.
      let intersecting_pairs = present_collisions(group);
      while (intersecting_pairs.length > 0) {
        for (const [entity_1, entity_2] of intersecting_pairs) {
          if (!entity_1.static) {
            old_entity_positions.set(entity_1, entity_1.position.clone());
          }
          if (!entity_2.static) {
            old_entity_positions.set(entity_2, entity_2.position.clone());
          }
          separate_entities(entity_1, entity_2, MIN_SEPARATION_DISTANCE);
          collide_entities(entity_1, entity_2);
        }
        intersecting_pairs = present_collisions(group);
      }
    });

    old_entity_positions.forEach((old_position, entity) => {
      this.collision_culler.moved(entity, old_position);
    });
  }

  private step_with_high_precision(dt: number) {
    const stepped_entities = new Set<Entity>();
    const old_entity_positions = new Map<Entity, Vec2>();

    // Save entity starting positions.
    this.entities.forEach((entity) => {
      old_entity_positions.set(entity, entity.position.clone());
    });

    // Handle groups of potentially colliding entities.
    this.collision_culler.for_each_potential_collision_group((group) => {
      for (let i = 0; i < group.length; ++i) {
        stepped_entities.add(group[i]);
      }
      this.step_entity_group(group, dt);
    });

    // Some entities were already stepped forward in time during collision handling,
    // now we step the rest.
    this.entities.forEach((entity) => {
      if (!stepped_entities.has(entity)) {
        step_entity(entity, dt);
      }
    });

    old_entity_positions.forEach((previous_position, entity) => {
      this.collision_culler.moved(entity, previous_position);
    });
  }

  private step_entity_group(group: Entity[], dt: number) {
    // Step forward in the time interval [now, now + dt] in small increments, ensuring that
    // collisions are resolved at their precise moment of occurrence.
    let t = dt;
    while (t > MIN_TIME_STEP_SIZE) {
      // Find the time of earliest collision.
      let earliest_collision: Collision | null = null;
      for (const collision of future_collisions(group, t)) {
        if (
          earliest_collision === null ||
          collision.time < earliest_collision.time
        ) {
          earliest_collision = collision;
        }
      }

      const time_step =
        earliest_collision !== null ? earliest_collision.time : dt;

      // Step entire group up to the time of earliest collision.
      for (const entity of group) {
        step_entity(entity, time_step);
      }

      // Handle the earliest collision.
      if (earliest_collision !== null) {
        collide_entities(
          earliest_collision.entities[0],
          earliest_collision.entities[1]
        );
        separate_entities(
          earliest_collision.entities[0],
          earliest_collision.entities[1],
          MIN_SEPARATION_DISTANCE
        );
      }

      // Update remaining time to move forward in time.
      t -= time_step;
    }
  }

  private step_with_low_precision(dt: number) {
    this.entities.forEach((entity) => {
      if (!entity.static) {
        const old_position = entity.position.clone();
        step_entity(entity, dt);
        this.collision_culler.moved(entity, old_position);
      }
    });
  }

  private next_entity_id = 0;
  private readonly collision_culler: CollisionCuller;
  private readonly entities = new Map<number, Entity>();
}
