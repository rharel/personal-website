define("linear_algebra/Vector", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // Two-dimensional vectors and related operations.
    class Vector {
        // Creates a new vector with the specified component values.
        constructor(x, y) {
            this.x = x;
            this.y = y;
        }
        // Creates a new vector by duplicating another.
        static duplicate(other) {
            return new Vector(other.x, other.y);
        }
        // Creates a new unit vector aligned with the horizontal axis.
        static unit_x() { return new Vector(1, 0); }
        // Creates a new unit vector aligned with the vertical axis.
        static unit_y() { return new Vector(0, 1); }
        // Creates a new vector with uniform component values.
        static uniform(value) { return new Vector(value, value); }
        // Creates a new uniform vector with component value zero.
        static zero() { return Vector.uniform(0); }
        // Creates a new uniform vector with component value one.
        static one() { return Vector.uniform(1); }
        // Computes the negation of a vector.
        static negative(u) {
            return new Vector(-u.x, -u.y);
        }
        // Computes the normalized version of a vector.
        static unit(u) {
            const L = 1 / u.length();
            return new Vector(u.x * L, u.y * L);
        }
        // Computes the component-wise addition of two vectors.
        static add(u, v) {
            return new Vector(u.x + v.x, u.y + v.y);
        }
        // Computes the component-wise subtraction of one vector from another.
        static subtract(u, v) {
            return new Vector(u.x - v.x, u.y - v.y);
        }
        // Computes the scalar multiplication of a vector.
        static scale(u, scalar) {
            return new Vector(u.x * scalar, u.y * scalar);
        }
        // Preserves direction but creates a vector with the specified length.
        static with_length(u, scalar) {
            const L = scalar / u.length();
            return new Vector(u.x * L, u.y * L);
        }
        // Computes the component-wise mapping of a vector with a specified transformation.
        static map(u, transform) {
            return new Vector(transform(u.x), transform(u.y));
        }
        // Negates this (in-place).
        negate() {
            this.x = -this.x;
            this.y = -this.y;
            return this;
        }
        // Normalizes this (in-place).
        normalize() {
            const L = 1 / this.length();
            this.x *= L;
            this.y *= L;
            return this;
        }
        // Preserves direction but sets a vector's length to the specified value.
        set_length(scalar) {
            const L = scalar / this.length();
            this.x *= L;
            this.y *= L;
            return this;
        }
        // Assign the value of another vector to this (in-place).
        assign(other) {
            this.x = other.x;
            this.y = other.y;
            return this;
        }
        // Performs component-wise addition of another vector to this (in-place).
        add(other) {
            this.x += other.x;
            this.y += other.y;
            return this;
        }
        // Performs component-wise subtraction of another vector from this (in-place).
        subtract(other) {
            this.x -= other.x;
            this.y -= other.y;
            return this;
        }
        // Scales this (in-place).
        scale(scalar) {
            this.x *= scalar;
            this.y *= scalar;
            return this;
        }
        // Performs component-wise mapping of this (in-place).
        map(transform) {
            this.x = transform(this.x);
            this.y = transform(this.y);
            return this;
        }
        // Computes the dot product between this and another vector.
        dot(other) {
            return this.x * other.x +
                this.y * other.y;
        }
        // Computes the z-component of the cross product between this and another vector.
        cross(other) {
            return this.x * other.y -
                this.y * other.x;
        }
        // Computes the squared length of this.
        length_squared() {
            return this.x * this.x +
                this.y * this.y;
        }
        // Computes the length of this.
        length() {
            return Math.sqrt(this.x * this.x +
                this.y * this.y);
        }
        // Computes the squared distance between this and another vector.
        distance_squared_to(other) {
            const dx = other.x - this.x;
            const dy = other.y - this.y;
            return dx * dx + dy * dy;
        }
        // Computes the distance between this and another vector.
        distance_to(other) {
            const dx = other.x - this.x;
            const dy = other.y - this.y;
            return Math.sqrt(dx * dx + dy * dy);
        }
    }
    // The zero vector.
    Vector.ZERO = Vector.zero();
    exports.default = Vector;
});
define("geometry/Disc", ["require", "exports", "linear_algebra/Vector"], function (require, exports, Vector_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // Represents a rectangular geometry.
    class Disc {
        // Creates a new disc geometry with the specified radius.
        constructor(radius) {
            this.radius = radius;
            this.center_of_mass = Vector_1.default.uniform(radius);
        }
        // This geometry's moment of inertia for a body of the specified mass.
        moment_of_inertia(mass) {
            const r2 = Math.pow(this.radius, 2);
            return 0.5 * mass * r2;
        }
    }
    exports.default = Disc;
});
define("simulation/RigidBody", ["require", "exports", "linear_algebra/Vector"], function (require, exports, Vector_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // Represents a rigid body.
    class RigidBody {
        // Creates a new body with the specified mass.
        constructor(mass, elasticity = 1) {
            // This body's position vector.
            this.position = Vector_2.default.zero();
            // This body's rotation angle.
            this.rotation = 0.0;
            // This body's velocity vector.
            this.velocity = Vector_2.default.zero();
            // This body's angular velocity.
            this.angular_velocity = 0.0;
            if (mass <= 0) {
                throw new Error("Rigid bodies cannot have a non-positive mass.");
            }
            if (elasticity < 0) {
                throw new Error("Rigid bodies cannot have negative elasticity.");
            }
            this.mass = mass;
            this.mass_inverse = 1 / mass;
            this.elasticity = elasticity;
        }
        // Computes this body's linear momentum.
        momentum() {
            return Vector_2.default.scale(this.velocity, this.mass);
        }
        // Computes this body's kinetic energy.
        kinetic_energy() {
            return 0.5 * this.mass * this.velocity.length_squared();
        }
    }
    exports.default = RigidBody;
});
define("simulation/Entity", ["require", "exports", "linear_algebra/Vector"], function (require, exports, Vector_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // Represents a two-dimensional physical entity.
    class Entity {
        // Creates a new entity made up of the specified body and geometry.
        constructor(body, geometry) {
            // Indicates whether this entity's position and rotation are fixed.
            this.is_static = false;
            // The linear force being applied to this entity.
            this.applied_force = Vector_3.default.zero();
            // The rotational force being applied to this entity.
            this.applied_torque = 0;
            this.body = body;
            this.geometry = geometry;
            this.moment_of_inertia = geometry.moment_of_inertia(body.mass);
            this.moment_of_inertia_inverse = 1 / this.moment_of_inertia;
        }
    }
    exports.default = Entity;
});
define("common/Indexable", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
});
define("numerical_analysis/utilities", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // Determines which number is the maximum and which is the minimum of a pair.
    //
    // a:
    //      The first number.
    // b:
    //      The second number.
    //
    // Returns an array [min(a, b), max(a, b)].
    //
    function minmax(a, b) {
        if (a <= b) {
            return [a, b];
        }
        else {
            return [b, a];
        }
    }
    exports.minmax = minmax;
});
define("numerical_analysis/quadratic", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // Solves the quadratic equation ax^2 + bx + c = 0.
    //
    // a, b, c:
    //      The equation's coefficients.
    // output:
    //      The output buffer.
    //
    // Returns the solution count (0-2).
    //
    function solve(a, b, c, output) {
        const b2_4ac = b * b - 4 * a * c;
        if (b2_4ac < 0) {
            return 0;
        }
        else if (b2_4ac > 0) {
            const sqrt_b2_4ac = Math.sqrt(b2_4ac);
            const _2a = 2 * a;
            output[0] = (-b + sqrt_b2_4ac) / _2a;
            output[1] = (-b - sqrt_b2_4ac) / _2a;
            return 2;
        }
        else {
            output[0] = -b / (2 * a);
            return 1;
        }
    }
    exports.solve = solve;
});
define("geometry/intersection", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // Tests if two discs intersect.
    //
    // c1, r1:
    //      The first disc's center and radius.
    // c2, r2:
    //      The second disc's center and radius.
    //
    // Returns true iff the discs intersect.
    //
    function test_for_intersection(c1, r1, c2, r2) {
        return c1.distance_squared_to(c2) <= Math.pow(r1 + r2, 2);
    }
    exports.test_for_intersection = test_for_intersection;
});
define("collision/narrowphase/detection", ["require", "exports", "numerical_analysis/utilities", "numerical_analysis/quadratic", "geometry/intersection"], function (require, exports, utilities_1, quadratic_1, intersection_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class CollisionTester {
        // Tests whether two discs with the specified velocities collide in the near future.
        //
        // c1, v1, r1:
        //      The first disc's center, velocity, and radius.
        // c2, v2, r2:
        //      The second disc's center, velocity, and radius.
        // dt:
        //      The length of time into the future to check for collision.
        //
        // Returns -1 if the discs do not collide in the next dt units of time, or the time of
        // collision if they do.
        //
        static test_for_collision(c1, v1, r1, c2, v2, r2, dt) {
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
            //
            const dv_x = v1.x - v2.x;
            const dv_y = v1.y - v2.y;
            const dv_x2 = dv_x * dv_x;
            const dv_y2 = dv_y * dv_y;
            const dc_x = c1.x - c2.x;
            const dc_y = c1.y - c2.y;
            const dc_x2 = dc_x * dc_x;
            const dc_y2 = dc_y * dc_y;
            const solution = CollisionTester._quadratic_solution;
            const solution_count = quadratic_1.solve(dv_x2 + dv_y2, 2 * (dc_x * dv_x + dc_y * dv_y), dc_x2 + dc_y2 - Math.pow(r1 + r2, 2), solution);
            let t;
            if (solution_count === 2) {
                const [t1, t2] = utilities_1.minmax(solution[0], solution[1]);
                t = t1;
                if (t1 < 0 && t2 >= 0) {
                    return 0;
                }
            }
            else if (solution_count === 0) {
                return -1;
            }
            else {
                t = solution[0];
            }
            if (0 <= t && t <= dt) {
                return t;
            }
            else {
                return -1;
            }
        }
    }
    CollisionTester._quadratic_solution = [0, 0];
    exports.CollisionTester = CollisionTester;
    // Finds near-future colliding pairs for a set of discs.
    //
    // entities:
    //      An indexable of entities.
    // entity_count:
    //      The number of items in the entities indexable.
    // dt:
    //      The length of time into the future to check for collision.
    //
    // out_indices:
    //      A buffer that will hold the indices of entities who are part of a collision pair.
    // out_pair_indices, out_pair_collision_times:
    //      Pairs an entity's index with both the index of its colliding partner and the time of
    //      collision if it indeed collides, otherwise maps it to -1.
    //
    // Returns the number of colliding pairs detected.
    //
    function find_colliding_pairs(entities, entity_count, dt, out_indices, out_pair_indices, out_pair_collision_times) {
        let i = 0, j, k;
        let t;
        let a, b;
        let a_is_static, a_body_position, a_body_velocity, a_geometry_radius;
        const test_for_collision = CollisionTester.test_for_collision;
        for (j = 0; j < entity_count; ++j) {
            out_pair_indices[j] = -1;
        }
        for (j = 0; j < entity_count; ++j) {
            a = entities[j];
            a_is_static = a.is_static;
            a_body_position = a.body.position;
            a_body_velocity = a.body.velocity;
            a_geometry_radius = a.geometry.radius;
            for (k = j + 1; k < entity_count; ++k) {
                b = entities[k];
                if (a_is_static && b.is_static) {
                    continue;
                }
                t = test_for_collision(a_body_position, a_body_velocity, a_geometry_radius, b.body.position, b.body.velocity, b.geometry.radius, dt);
                if (t !== -1) {
                    out_pair_indices[j] = k;
                    out_pair_indices[k] = j;
                    out_pair_collision_times[j] = t;
                    out_indices[i] = j;
                    ++i;
                }
            }
        }
        return i;
    }
    exports.find_colliding_pairs = find_colliding_pairs;
    // Finds intersecting pairs for a set of discs.
    //
    // entities:
    //      An indexable of entities.
    // entity_count:
    //      The number of items in the entities indexable.
    //
    // out_indices:
    //      A buffer that will hold the indices of entities who are part of an intersecting pair.
    // out_pairs:
    //      Pairs an entity's index with the index of its intersecting partner if it exists, otherwise
    //      maps it to -1.
    //
    // Returns the number of intersecting pairs detected.
    //
    function find_intersecting_pairs(entities, entity_count, out_indices, out_pairs) {
        let i = 0, j, k;
        let a, b;
        let a_is_static, a_body_position, a_geometry_radius;
        for (j = 0; j < entity_count; ++j) {
            out_pairs[j] = -1;
        }
        for (j = 0; j < entity_count; ++j) {
            if (out_pairs[j] !== -1) {
                continue;
            }
            a = entities[j];
            a_is_static = a.is_static;
            a_body_position = a.body.position;
            a_geometry_radius = a.geometry.radius;
            for (k = j + 1; k < entity_count; ++k) {
                b = entities[k];
                if (a_is_static && b.is_static) {
                    continue;
                }
                if (intersection_1.test_for_intersection(a_body_position, a_geometry_radius, b.body.position, b.geometry.radius)) {
                    out_pairs[j] = k;
                    out_pairs[k] = j;
                    out_indices[i] = j;
                    ++i;
                    break;
                }
            }
        }
        return i;
    }
    exports.find_intersecting_pairs = find_intersecting_pairs;
});
define("collision/narrowphase/resolution", ["require", "exports", "linear_algebra/Vector"], function (require, exports, Vector_4) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // Computes and applies the elastic collision response for two discs.
    //
    // x1, u1, m1, e1:
    //      The first disc's position, velocity, mass, and elasticity.
    // x2, u2, m2, e2:
    //      The second disc's position, velocity, mass, and elasticity.
    // target:
    //      The entity/entities to apply the response to.
    // [distance]:
    //      The distance to assume there is between x1 and x2.
    //
    function apply_collision_response(x1, u1, m1, e1, x2, u2, m2, e2, target, distance) {
        const dx = Vector_4.default.subtract(x1, x2);
        const du = Vector_4.default.subtract(u1, u2);
        if (distance !== undefined) {
            dx.set_length(distance);
        }
        const COR = 0.5 * (e1 + e2); // coefficient of restitution
        const C = COR * 2 * du.dot(dx) / ((m1 + m2) * dx.length_squared());
        switch (target) {
            case Target.First:
                {
                    u1.subtract(dx.scale(C * m2));
                    return;
                }
            case Target.Second:
                {
                    u2.subtract(dx.scale(-C * m1));
                    return;
                }
            default:
                {
                    u1.subtract(Vector_4.default.scale(dx, C * m2));
                    u2.subtract(Vector_4.default.scale(dx, -C * m1));
                    return;
                }
        }
    }
    exports.apply_collision_response = apply_collision_response;
    // Separates two discs from each other until the distance between them is at least as large as the
    // specified threshold.
    //
    // c1, r1:
    //      The first disc's center and radius.
    // c2, r2:
    //      The second disc's center and radius.
    // padding:
    //      The minimum distance to leave between the two discs.
    // target:
    //      The entity/entities to move.
    //
    function separate(c1, r1, c2, r2, padding, target) {
        const R = r1 + r2 + padding;
        const D2 = c1.distance_squared_to(c2);
        if (D2 >= Math.pow(R, 2)) {
            return;
        }
        else {
            // Collision axis:
            const u = Vector_4.default.subtract(c1, c2).normalize();
            // The offset by which to move each body along the collision axis:
            let h = R - Math.sqrt(D2);
            switch (target) {
                case Target.First:
                    {
                        c1.add(u.scale(h));
                        return;
                    }
                case Target.Second:
                    {
                        c2.add(u.scale(-h));
                        return;
                    }
                default:
                    {
                        h = h * 0.5;
                        c1.add(Vector_4.default.scale(u, h));
                        c2.add(Vector_4.default.scale(u, -h));
                        return;
                    }
            }
        }
    }
    exports.separate = separate;
    // Enumerates possible non-empty subsets of a pair.
    var Target;
    (function (Target) {
        Target[Target["First"] = 0] = "First";
        Target[Target["Second"] = 1] = "Second";
        Target[Target["Both"] = 2] = "Both";
    })(Target = exports.Target || (exports.Target = {}));
});
define("collision/broadphase/Broadphase", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
});
define("collision/broadphase/NaiveBroadphase", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // Represents a naive collision culling operation, i.e. no culling takes place at all.
    class NaiveBroadphase {
        constructor() {
            this._entities = [];
        }
        // Clears all entities.
        clear() { this._entities = []; }
        // Includes the specified entity.
        add(entity) { this._entities.push(entity); }
        // Excludes the specified entity.
        remove(entity) {
            const i = this._entities.indexOf(entity);
            this._entities.splice(i, 1);
        }
        // Signals that the specified entity has moved.
        update() { }
        // Invokes a callback for each group of entities detected to potentially contain collisions in
        // the near future. The callback receives an indexable and its size.
        //
        // This naive implementation simply returns all entities.
        //
        for_each_potential_collision_group(callback) {
            callback(this._entities, this._entities.length);
        }
    }
    exports.default = NaiveBroadphase;
});
define("simulation/World", ["require", "exports", "geometry/Disc", "linear_algebra/Vector", "collision/narrowphase/detection", "collision/narrowphase/resolution", "simulation/Entity", "simulation/RigidBody", "collision/broadphase/NaiveBroadphase"], function (require, exports, Disc_1, Vector_5, detection_1, resolution_1, Entity_1, RigidBody_1, NaiveBroadphase_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function default_options() {
        return {
            broadphase: new NaiveBroadphase_1.default(),
            do_step_piecewise: false
        };
    }
    // Represents a two dimensional physics simulation.
    class World {
        // Creates a new world using the specified user options.
        constructor(user_options) {
            this._entity_set = new Set();
            this._dirty_entities = new Map();
            this._stepped_entities = new Set();
            const options = Object.assign({}, default_options(), user_options);
            this._broadphase = options.broadphase;
            this._do_step_piecewise = options.do_step_piecewise;
        }
        // Gets the number of spawned entities.
        get entity_count() { return this._entity_set.size; }
        // Indicates whether this world contains the specified entity.
        contains(entity) {
            return this._entity_set.has(entity);
        }
        // Spawns a new entity with the specified mass and radius.
        spawn(mass, radius, elasticity = 1) {
            const body = new RigidBody_1.default(mass, elasticity);
            const entity = new Entity_1.default(body, new Disc_1.default(radius));
            this._entity_set.add(entity);
            return entity;
        }
        // De-spawns an existing entity.
        despawn(entity) {
            if (!this.contains(entity)) {
                throw new Error("Cannot despawn a non-existent entity.");
            }
            this._entity_set.delete(entity);
        }
        // De-spawns all entities.
        clear() {
            this._entity_set.clear();
        }
        // Initializes the simulation. Call this after you are done invoking spawn()/despawn()/clear().
        initialize() {
            const n = this._entity_set.size;
            this._entity_array = [];
            this._buffer_A = new Array(n);
            this._buffer_B = new Array(n);
            this._buffer_C = new Array(n);
            this._buffer_D = new Array(n);
            this._broadphase.clear();
            this._entity_set.forEach(entity => {
                this._entity_array.push(entity);
                this._broadphase.add(entity);
            });
        }
        // Advances the simulation in time.
        step(dt) {
            if (dt <= 0) {
                return;
            }
            this._separate_colliding_bodies();
            if (this._do_step_piecewise) {
                this._step_piecewise(dt);
            }
            else {
                this._step(dt);
            }
            // Detecting particles at rest:
            this._entity_array.forEach(entity => {
                const v = entity.body.velocity;
                if (v.length_squared() < REST_VELOCITY_THRESHOLD) {
                    v.assign(Vector_5.default.ZERO);
                }
            });
        }
        for_each_entity(callback) {
            this._entity_array.forEach(callback);
        }
        _separate_colliding_bodies() {
            let intersection_count;
            const indices = this._buffer_A, pairs = this._buffer_B;
            const dirty_set = this._dirty_entities;
            dirty_set.clear();
            this._broadphase.for_each_potential_collision_group((group, size) => {
                intersection_count = detection_1.find_intersecting_pairs(group, size, indices, pairs);
                while (intersection_count > 0) {
                    for (let i = 0; i < intersection_count; ++i) {
                        const j = indices[i];
                        const k = pairs[j];
                        const a = group[j];
                        const b = group[k];
                        if (!a.is_static) {
                            dirty_set.set(a, Vector_5.default.duplicate(a.body.position));
                        }
                        if (!b.is_static) {
                            dirty_set.set(b, Vector_5.default.duplicate(b.body.position));
                        }
                        World._separate(a, b);
                        World._collide(a, b);
                    }
                    intersection_count = detection_1.find_intersecting_pairs(group, size, indices, pairs);
                }
            });
            dirty_set.forEach((previous_position, entity) => {
                this._broadphase.update(entity, previous_position);
            });
        }
        _step_piecewise(dt) {
            const entities = this._entity_array;
            const stepped = this._stepped_entities;
            const dirty_set = this._dirty_entities;
            const broadphase = this._broadphase;
            entities.forEach(entity => {
                dirty_set.set(entity, Vector_5.default.duplicate(entity.body.position));
            });
            stepped.clear();
            broadphase.for_each_potential_collision_group((group, size) => {
                for (let i = 0; i < size; ++i) {
                    stepped.add(group[i]);
                }
                this._step_group(group, size, dt);
            });
            entities.forEach(entity => {
                if (!stepped.has(entity)) {
                    World._step_entity(entity, dt);
                }
            });
            dirty_set.forEach((previous_position, entity) => {
                broadphase.update(entity, previous_position);
            });
        }
        _step_group(group, size, dt) {
            let collision_count;
            let t, t_min;
            let j_min = 0, k_min = 0;
            const indices = this._buffer_A, pairs = this._buffer_B, collision_times = this._buffer_C;
            t = dt;
            while (t > MIN_TIME_STEP_SIZE) {
                collision_count = detection_1.find_colliding_pairs(group, size, t, indices, pairs, collision_times);
                t_min = t;
                for (let i = 0; i < collision_count; ++i) {
                    const j = indices[i];
                    const k = pairs[j];
                    const collision_time = collision_times[j];
                    if (collision_time < t_min) {
                        j_min = j;
                        k_min = k;
                        t_min = collision_time;
                    }
                }
                for (let i = 0; i < size; ++i) {
                    World._step_entity(group[i], t_min);
                }
                if (t_min < t) {
                    World._collide(group[j_min], group[k_min]);
                    World._separate(group[j_min], group[k_min]);
                }
                t = t - t_min;
            }
        }
        _step(dt) {
            const previous_position = Vector_5.default.zero();
            this._entity_array.forEach(entity => {
                if (!entity.is_static) {
                    previous_position.assign(entity.body.position);
                    World._step_entity(entity, dt);
                    this._broadphase.update(entity, previous_position);
                }
            });
        }
        static _step_entity(entity, dt) {
            const body = entity.body;
            const half_dt = 0.5 * dt;
            {
                const F = entity.applied_force, m_inv = body.mass_inverse, c = body.position, v = body.velocity;
                const A = half_dt * m_inv;
                c.x += dt * (v.x + A * F.x);
                c.y += dt * (v.y + A * F.y);
                const B = dt * m_inv;
                v.x += B * F.x;
                v.y += B * F.y;
            }
            {
                const adt = entity.applied_torque * entity.moment_of_inertia_inverse * dt;
                body.rotation += body.angular_velocity * dt + half_dt * adt;
                body.angular_velocity += adt;
            }
        }
        // (assumes at most one of a, b is static)
        static _separate(a, b) {
            const target = a.is_static ? resolution_1.Target.Second :
                b.is_static ? resolution_1.Target.First :
                    resolution_1.Target.Both;
            resolution_1.separate(a.body.position, a.geometry.radius, b.body.position, b.geometry.radius, SEPARATION_PADDING, target);
        }
        // (assumes at most one of a, b is static)
        static _collide(a, b) {
            // Ensure possibly static entity is assigned to a:
            if (b.is_static) {
                const c = a;
                a = b;
                b = c;
            }
            const a_body = a.body, b_body = b.body;
            const R = a.geometry.radius + b.geometry.radius;
            if (a.is_static) {
                resolution_1.apply_collision_response(a_body.position, Vector_5.default.ZERO, STATIC_MASS, a_body.elasticity, b_body.position, b_body.velocity, b_body.mass, b_body.elasticity, resolution_1.Target.Second, R);
            }
            else {
                resolution_1.apply_collision_response(a_body.position, a_body.velocity, a_body.mass, a_body.elasticity, b_body.position, b_body.velocity, b_body.mass, b_body.elasticity, resolution_1.Target.Both, R);
            }
        }
    }
    exports.default = World;
    const STATIC_MASS = Math.pow(10, 14);
    const MIN_TIME_STEP_SIZE = 0.001;
    const SEPARATION_PADDING = 0.001;
    const REST_VELOCITY_THRESHOLD = 0.001;
});
define("spatial_partitions/BoundingBox", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // Represents an axis-aligned bounding box.
    class BoundingBox {
        // Creates a new box from the specified extents.
        static from_extents(left, right, bottom, top) {
            const box = new BoundingBox();
            box.left = left;
            box.right = right;
            box.bottom = bottom;
            box.top = top;
            return box;
        }
        // Creates a new box from the specified center position and size dimensions.
        static from_center_and_size(center_x, center_y, width, height) {
            const box = new BoundingBox();
            const w2 = 0.5 * width;
            const h2 = 0.5 * height;
            box.left = center_x - w2;
            box.right = center_x + w2;
            box.bottom = center_y - h2;
            box.top = center_y + h2;
            return box;
        }
        // Creates a new box from the specified center position and radius.
        static from_center_and_radius(center_x, center_y, radius) {
            const box = new BoundingBox();
            box.left = center_x - radius;
            box.right = center_x + radius;
            box.bottom = center_y - radius;
            box.top = center_y + radius;
            return box;
        }
        // Computes the union of two boxes.
        static union(first, second) {
            const box = new BoundingBox();
            box.left = Math.min(first.left, second.left);
            box.right = Math.max(first.right, second.right);
            box.bottom = Math.min(first.bottom, second.bottom);
            box.top = Math.max(first.top, second.top);
            return box;
        }
        ;
        // Computes the intersection of two boxes.
        static intersection(first, second) {
            const box = new BoundingBox();
            box.left = Math.max(first.left, second.left);
            box.right = Math.min(first.right, second.right);
            box.bottom = Math.max(first.bottom, second.bottom);
            box.top = Math.min(first.top, second.top);
            return box;
        }
        // Determines whether this box is degenerate (has zero/negative area).
        is_degenerate() {
            return this.left >= this.right ||
                this.bottom >= this.top;
        }
        // Determines whether the specified box overlaps this one.
        overlaps(other) {
            return other.left <= this.right &&
                other.right >= this.left &&
                other.bottom <= this.top &&
                other.top >= this.bottom;
        }
        // Determines whether the specified box is fully contained within this one.
        contains(other) {
            return other.left >= this.left &&
                other.right <= this.right &&
                other.bottom >= this.bottom &&
                other.top <= this.top;
        }
    }
    exports.default = BoundingBox;
});
define("spatial_partitions/Quadtree", ["require", "exports", "spatial_partitions/BoundingBox"], function (require, exports, BoundingBox_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // A data-structure representing a recursive partition of space into four quadrants.
    class Quadtree {
        // Creates a new tree with the specified depth and covering the specified region.
        //
        // depth:
        //      The desired depth.
        // bounds:
        //      The spatial bounds to partition.
        //
        constructor(depth, bounds, is_root = true) {
            this._population_count = 0;
            if (depth < 1) {
                depth = 1;
            }
            this.depth = depth;
            this.is_leaf = depth === 1;
            this.bounds = bounds;
            const w2 = 0.5 * (bounds.right - bounds.left), h2 = 0.5 * (bounds.top - bounds.bottom);
            this.center =
                {
                    x: bounds.left + w2,
                    y: bounds.bottom + h2
                };
            this.is_root = is_root;
            if (!this.is_leaf) {
                const child_depth = depth - 1;
                const { x, y } = this.center;
                const w4 = 0.5 * w2, h4 = 0.5 * h2;
                const box = BoundingBox_1.default.from_center_and_size;
                this._children =
                    [new Quadtree(child_depth, box(x - w4, y - h4, w2, h2), false),
                        new Quadtree(child_depth, box(x + w4, y - h4, w2, h2), false),
                        new Quadtree(child_depth, box(x - w4, y + h4, w2, h2), false),
                        new Quadtree(child_depth, box(x + w4, y + h4, w2, h2), false) // NE
                    ];
            }
            else {
                this._population = new Array(2);
            }
        }
        // Indicates whether this node contains any entities.
        get is_empty() { return this._population_count === 0; }
        // Indicates how many entities are contained in this node.
        get population_count() { return this._population_count; }
        // Gets this node's entities (only applicable to leaves).
        get population() { return this._population; }
        // Clears the structure of all entities.
        clear() {
            if (!this.is_root) {
                throw new Error("Only a root node may clear().");
            }
            this._clear();
        }
        // Adds the specified entity to the structure.
        //
        // Returns true iff the entity's bounding box overlaps the bounds of this node and therefore
        // was added successfully.
        //
        add(entity, region) {
            if (!this.is_root) {
                throw new Error("Only a root node may add().");
            }
            if (region === undefined) {
                const p = entity.body.position;
                region = BoundingBox_1.default.from_center_and_radius(p.x, p.y, entity.geometry.radius);
            }
            if (region.overlaps(this.bounds)) {
                this._associate(entity, region);
                return true;
            }
            else {
                return false;
            }
        }
        // Removes the specified entity from the structure.
        //
        // Returns true iff the entity's bounding box overlaps the bounds of this node and therefore
        // was removed successfully.
        //
        remove(entity, region) {
            if (!this.is_root) {
                throw new Error("Only a root node may remove().");
            }
            if (region === undefined) {
                const p = entity.body.position;
                region = BoundingBox_1.default.from_center_and_radius(p.x, p.y, entity.geometry.radius);
            }
            if (region.overlaps(this.bounds)) {
                this._disassociate(entity, region);
                return true;
            }
            else {
                return false;
            }
        }
        // Updates the region associated with the specified entity.
        //
        // Returns true iff the entity's bounding box overlaps the bounds of this node.
        //
        move(entity, previous_region, current_region) {
            if (!this.is_root) {
                throw new Error("Only a root node may move().");
            }
            if (current_region === undefined) {
                const p = entity.body.position;
                current_region = BoundingBox_1.default.from_center_and_radius(p.x, p.y, entity.geometry.radius);
            }
            if (current_region.overlaps(this.bounds)) {
                const intersection = BoundingBox_1.default.intersection(previous_region, current_region);
                if (intersection.is_degenerate()) {
                    this._disassociate(entity, previous_region);
                    this._associate(entity, current_region);
                }
                else {
                    const union = BoundingBox_1.default.union(previous_region, current_region);
                    this._move(entity, previous_region, current_region, union, intersection);
                }
                return true;
            }
            else {
                this._disassociate(entity, previous_region);
                return false;
            }
        }
        // Invokes a callback for each of this node's children.
        for_each_child(callback) {
            this._children.forEach(callback);
        }
        // Invokes a callback for each of this node's leaves.
        for_each_leaf(callback) {
            if (this.is_leaf) {
                callback(this);
            }
            else {
                this._children.forEach(child => {
                    child.for_each_leaf(callback);
                });
            }
        }
        // Invokes a callback for each of this node's leaves which are not empty.
        for_each_non_empty_leaf(callback) {
            this.for_each_leaf_with_at_least(1, callback);
        }
        // Invokes a callback for each of this node's leaves which contain at least a specified number
        // of entities.
        for_each_leaf_with_at_least(threshold, callback) {
            if (this._population_count < threshold) {
                return;
            }
            else if (this.is_leaf) {
                callback(this);
            }
            else {
                this._children.forEach(child => {
                    child.for_each_leaf_with_at_least(threshold, callback);
                });
            }
        }
        // Invokes a callback for each entity of this node (only applicable for leaves).
        for_each_entity(callback) {
            if (this.is_leaf) {
                this._population.forEach(callback);
            }
        }
        _clear() {
            if (this._population_count === 0) {
                return;
            }
            else if (!this.is_leaf) {
                this._children.forEach(child => {
                    child._clear();
                });
            }
            this._population_count = 0;
        }
        _associate(entity, region) {
            if (!this.is_leaf) {
                let n = 0;
                this._for_each_overlapping_child(region, child => {
                    n = n + child._associate(entity, region);
                });
                this._population_count = this._population_count + n;
                return n;
            }
            let i;
            if ((i = this._population.indexOf(entity)) === -1 ||
                i >= this._population_count) {
                this._add(entity);
                return 1;
            }
            else {
                return 0;
            }
        }
        _disassociate(entity, region) {
            if (!this.is_leaf) {
                let n = 0;
                this._for_each_overlapping_child(region, child => {
                    n = n + child._disassociate(entity, region);
                });
                this._population_count = this._population_count + n;
                return n;
            }
            let i;
            if ((i = this._population.indexOf(entity)) !== -1 &&
                i < this._population_count) {
                this._remove(i);
                return -1;
            }
            else {
                return 0;
            }
        }
        _move(entity, previous_region, current_region, union, intersection) {
            if (!this.is_leaf) {
                if (intersection.contains(this.bounds)) {
                    return 0;
                }
                let n = 0;
                this._for_each_overlapping_child(union, child => {
                    n = n + child._move(entity, previous_region, current_region, union, intersection);
                });
                this._population_count = this._population_count + n;
                return n;
            }
            if (this.bounds.contains(union)) {
                return 0;
            }
            const overlaps_previous = previous_region.overlaps(this.bounds), overlaps_current = current_region.overlaps(this.bounds);
            if (overlaps_previous && overlaps_current) {
                return 0;
            }
            let i;
            if (overlaps_previous) {
                if ((i = this._population.indexOf(entity)) !== -1 &&
                    i < this._population_count) {
                    this._remove(i);
                    return -1;
                }
            }
            if (overlaps_current) {
                if ((i = this._population.indexOf(entity)) === -1 ||
                    i >= this._population_count) {
                    this._add(entity);
                    return 1;
                }
            }
            return 0;
        }
        // (assumes this is a leaf)
        _add(entity) {
            if (this._population_count < this._population.length) {
                this._population[this._population_count] = entity;
            }
            else {
                this._population.push(entity);
            }
            ++this._population_count;
        }
        // (assumes this is a leaf)
        _remove(index) {
            if (index < this._population_count - 1) {
                this._population.splice(index, 1);
            }
            --this._population_count;
        }
        // (assumes this is an internal)
        _for_each_overlapping_child(region, callback) {
            const { left, right, bottom, top } = region;
            const { x, y } = this.center;
            const child = this._children;
            if (left <= x) {
                if (bottom <= y) {
                    callback(child[Quadtree.SW]);
                }
                if (top >= y) {
                    callback(child[Quadtree.NW]);
                }
            }
            if (right >= x) {
                if (bottom <= y) {
                    callback(child[Quadtree.SE]);
                }
                if (top >= y) {
                    callback(child[Quadtree.NE]);
                }
            }
        }
    }
    // Indices of individual quadrants in the children array.
    Quadtree.SW = 0;
    Quadtree.SE = 1;
    Quadtree.NW = 2;
    Quadtree.NE = 3;
    exports.default = Quadtree;
});
define("collision/broadphase/QuadtreeBroadphase", ["require", "exports", "spatial_partitions/BoundingBox"], function (require, exports, BoundingBox_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // Represents a collision culling operation using a quadtree.
    class QuadtreeBroadphase {
        // Creates a new broadphase using a tree of the specified depth and covering the specified
        // bounds.
        //
        constructor(tree) {
            if (!tree.is_root || !tree.is_empty) {
                throw new Error("The specified tree is not an empty root.");
            }
            this._tree = tree;
        }
        // Clears all entities.
        clear() { this._tree.clear(); }
        // Includes the specified entity.
        add(entity) { this._tree.add(entity); }
        // Excludes the specified entity.
        remove(entity) { this._tree.remove(entity); }
        // Signals that the specified entity has moved.
        update(entity, previous_position) {
            const previous_bounds = BoundingBox_2.default.from_center_and_radius(previous_position.x, previous_position.y, entity.geometry.radius);
            this._tree.move(entity, previous_bounds);
        }
        // Invokes a callback for each group of entities detected to potentially contain collisions in
        // the near future. The callback receives an indexable and its size.
        //
        // This quadtree-based implementation return groups of entities that share the same leaf node
        // in the tree.
        //
        for_each_potential_collision_group(callback) {
            this._tree.for_each_leaf_with_at_least(2, node => {
                callback(node.population, node.population_count);
            });
        }
    }
    exports.default = QuadtreeBroadphase;
});
define("RigidPhysics2D", ["require", "exports", "geometry/Disc", "linear_algebra/Vector", "simulation/Entity", "simulation/RigidBody", "simulation/World", "spatial_partitions/BoundingBox", "spatial_partitions/Quadtree", "collision/broadphase/NaiveBroadphase", "collision/broadphase/QuadtreeBroadphase"], function (require, exports, Disc_2, Vector_6, Entity_2, RigidBody_2, World_1, BoundingBox_3, Quadtree_1, NaiveBroadphase_2, QuadtreeBroadphase_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Disc = Disc_2.default;
    exports.Vector = Vector_6.default;
    exports.Entity = Entity_2.default;
    exports.RigidBody = RigidBody_2.default;
    exports.World = World_1.default;
    exports.BoundingBox = BoundingBox_3.default;
    exports.Quadtree = Quadtree_1.default;
    exports.NaiveBroadphase = NaiveBroadphase_2.default;
    exports.QuadtreeBroadphase = QuadtreeBroadphase_1.default;
});
