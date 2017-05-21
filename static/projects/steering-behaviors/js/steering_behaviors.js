(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/**
 * @author Raoul Harel
 * @license The MIT license (LICENSE.txt)
 * @copyright 2017 Raoul Harel
 * @url https://github.com/rharel/js-steering-behaviors
 */


const Vector = require('../math/Vector2');

/**
 * Drives a vehicle in alignment with nearby vehicles.
 *
 * @param get_neighbourhood_sites
 *    Callback that evaluates and returns an array of velocities of vehicles that
 *    are considered to be 'nearby'. The callback accepts a single Vector2
 *    argument indicating the driven vehicle's current position.
 * @constructor
 */
function Align(get_neighbourhood_sites)
{
	this._get_neighbourhood_sites = get_neighbourhood_sites;
	this._seek = new SB.Behavior.Seek(new Vector(0, 0), 0);
}
Align.prototype =
{
	constructor: Align,

	/**
	 * Drives the specified vehicle for the specified amount of time.
	 *
	 * @param vehicle
	 * 		The vehicle to drive.
	 * @param dt
	 * 		The drive's duration.
	 * @returns
	 * 		The desired force to be applied to the vehicle.
	 */
	drive: function(vehicle, dt = 1)
	{
		const sites = this._get_neighbourhood_sites(vehicle.position);

		if (sites.length === 0)
		{
			return vehicle.velocity.scale(-vehicle.mass / dt);
		}
		else
		{
			const average_velocity = new Vector(0, 0);
			sites.forEach(site =>
			{
				average_velocity.add_(site.data.velocity);
			});
			average_velocity.scale(1 / sites.length);

			this._seek.target.assign(vehicle.position.add(average_velocity));
			this._seek.desired_speed = average_velocity.norm();
			return this._seek.drive(vehicle, dt);
		}
	},

	get target() { return this._seek.target;},

	get repulsion_speed() { return this._seek.desired_speed; },
	set repulsion_speed(value) { this._seek.desired_speed = +value; }
};


module.exports = Align;

},{"../math/Vector2":10}],2:[function(require,module,exports){
/**
 * @author Raoul Harel
 * @license The MIT license (LICENSE.txt)
 * @copyright 2017 Raoul Harel
 * @url https://github.com/rharel/js-steering-behaviors
 */


const Seek = require('./Seek');
const Easing = require('../utility/Easing');

const EPSILON = 0.001;  // small number


/**
 * Drives a vehicle towards a given target position.
 *
 * @details
 *    Up until a given distance D from the target, this behavior is identical
 *    to Seek. When the character is <= D units away from the target, it will
 *    begin slowing down to a standstill.
 * @param target
 *    The target position.
 * @param desired_speed
 *    The cruising speed when outside of breaking radius.
 * @param breaking_distance
 *    The distance to the target from which to begin breaking.
 * @param easing
 *    The easing function applied to the character's velocity once inside the
 *    breaking radius (default is Easing.linear).
 * @constructor
 */
function Arrive(
	target,
	desired_speed,
	breaking_distance,
	easing = Easing.linear)
{
	this._desired_speed = desired_speed;
	this._seek = new Seek(target, desired_speed);
	this._breaking_distance = breaking_distance;
	this._ease = easing;
}
Arrive.prototype =
{
	constructor: Arrive,

	/**
	 * Drives the specified vehicle for the specified amount of time.
	 *
	 * @param vehicle
	 * 		The vehicle to drive.
	 * @param dt
	 * 		The drive's duration.
	 * @returns
	 * 		The desired force to be applied to the vehicle.
	 */
	drive: function(vehicle, dt = 1)
	{
		let distance_to_target =
			vehicle.position.distance_to(this._seek.target);

		if (distance_to_target < EPSILON)
		{
			distance_to_target = 0;
		}
		if (distance_to_target <= this._breaking_distance)
		{
			this._seek.desired_speed = this._ease
			(
				0,
				this._desired_speed,
				distance_to_target / this._breaking_distance
			);
		}
		else
		{
			this._seek.desired_speed = this._desired_speed;
		}

		return this._seek.drive(vehicle, dt);
	},

	get target() { return this._seek.target;},

	get desired_speed() { return this._desired_speed; },
	set desired_speed(value) { this._desired_speed = +value; },

	get breaking_distance() { return this._breaking_distance; },
	set breaking_distance(value) { this._breaking_distance = +value; },

	get ease() { return this._ease; },
	set ease(value) { this._ease = value; }
};


module.exports = Arrive;

},{"../utility/Easing":12,"./Seek":5}],3:[function(require,module,exports){
/**
 * @author Raoul Harel
 * @license The MIT license (LICENSE.txt)
 * @copyright 2017 Raoul Harel
 * @url https://github.com/rharel/js-steering-behaviors
 */


const Vector = require('../math/Vector2');

/**
 * Drives the vehicle along a path.
 *
 * @param checkpoints
 * 		An array of positions.
 * @param desired_speed
 * 		The desired cruising speed.
 * @param breaking_distance
 *      The distance to the target from which to begin breaking.
 * @param do_loop
 * 		True iff the patrol should loop.
 * @constructor
 */
function Patrol
(
	checkpoints,
	desired_speed,
	breaking_distance,
	error_margin = 0.01,
	do_loop = true)
{
	this._checkpoints = checkpoints;
	this._target_index = 0;
	this._arrive = new SB.Behavior.Arrive
	(
		checkpoints[0],
		desired_speed,
		breaking_distance
	);
	this._error_margin = error_margin;
	this._do_loop = do_loop;
}
Patrol.prototype =
{
	constructor: Patrol,

	/**
	 * Drives the specified vehicle for the specified amount of time.
	 *
	 * @param vehicle
	 * 		The vehicle to drive.
	 * @param dt
	 * 		The drive's duration.
	 * @returns
	 * 		The desired force to be applied to the vehicle.
	 */
	drive: function(vehicle, dt = 1)
	{
		let target = this._arrive.target;
		while (vehicle.position.distance_to(target) < this._error_margin)
		{
			if (this._target_index === this._checkpoints.length - 1)
			{
				if (this._do_loop)
				{
					this._target_index = -1;
				}
				else
				{
					return new Vector(0, 0);
				}
			}
			else
			{
				++ this._target_index;
				target.assign(this._checkpoints[this._target_index]);
			}
		}
		return this._arrive.drive(vehicle, dt);
	},

	get desired_speed() { return this._arrive.desired_speed; },
	set desired_speed(value) { this._arrive.desired_speed = +value; },

	get breaking_distance() { return this._arrive.breaking_distance; },
	set breaking_distance(value) { this.breaking_distance = +value; }
};


module.exports = Patrol;

},{"../math/Vector2":10}],4:[function(require,module,exports){
/**
 * @author Raoul Harel
 * @license The MIT license (LICENSE.txt)
 * @copyright 2017 Raoul Harel
 * @url https://github.com/rharel/js-steering-behaviors
 */


const Seek = require('./Seek');
const Predictor = require('../utility/Predictor');

/**
 * Drives the vehicle to seek a dynamic position.
 *
 * @param get_target
 *    Callback yielding the target position to seek.
 * @param desired_speed
 *    The desired cruising speed.
 * @param do_evade
 *    If true, drives the vehicle away from the target instead of towards it
 *    (default is false).
 * @constructor
 */
function Pursue(get_target, desired_speed, do_evade = false)
{
	this._get_target = get_target;
	this._seek = new Seek(new SB.Vector(0, 0), desired_speed, do_evade);
}
/**
 * Drives the vehicle to intercept another vehicle.
 *
 * @param target
 * 		The vehicle to pursue.
 * @param desired_speed
 * 		The desired cruising speed.
 * @param predict_position
 * 		A function which takes in a vehicle and outputs an approximation of its
 * 		future position (default is linear extrapolation).
 * @param do_evade
 * 		If true, drives the vehicle away from the target instead of towards it
 * 		(default is false).
 * @returns {Pursue}
 */
Pursue.vehicle = function(
	target,
	desired_speed,
	predict_position = Predictor.static(0.1),
	do_evade = false)
{
	return new Pursue(
		() => predict_position(target),
		desired_speed,
		do_evade
	);
};
Pursue.prototype =
{
	constructor: Pursue,

	/**
	 * Drives the specified vehicle for the specified amount of time.
	 *
	 * @param vehicle
	 * 		The vehicle to drive.
	 * @param dt
	 * 		The drive's duration.
	 * @returns
	 * 		The desired force to be applied to the vehicle.
	 */
	drive: function(vehicle, dt = 1)
	{
		this._seek.target.assign(this._get_target());

		return this._seek.drive(vehicle, dt);
	},

	get get_target() { return this._get_target; },
	set get_target(value) { this._get_target = value; },

	get target() { return this._seek.target; },
	set target(value) { this._seek.target.assign(value); },

	get desired_speed() { return this._seek.desired_speed; },
	set desired_speed(value) { this._seek.desired_speed = value; },

	is_evading: function() { return this._seek.is_fleeing(); },
	evade: function() { this._seek.flee(); },
	pursue: function() { this._seek.seek(); },
};


module.exports = Pursue;

},{"../utility/Predictor":13,"./Seek":5}],5:[function(require,module,exports){
/**
 * @author Raoul Harel
 * @license The MIT license (LICENSE.txt)
 * @copyright 2017 Raoul Harel
 * @url https://github.com/rharel/js-steering-behaviors
 */


/**
 * Drives the vehicle towards a target position.
 *
 * @param target
 *    The destination.
 * @param desired_speed
 *    The desired cruising speed.
 * @param do_flee
 *    If true, drives the vehicle away from the target instead of towards it
 *    (default is false).
 * @constructor
 */
function Seek(target, desired_speed, do_flee = false)
{
	this._target = target.clone();
	this._desired_speed = desired_speed;
	this._do_flee = do_flee;
}
Seek.prototype =
{
	constructor: Seek,

	/**
	 * Drives the specified vehicle for the specified amount of time.
	 *
	 * @param vehicle
	 * 		The vehicle to drive.
	 * @param dt
	 * 		The drive's duration.
	 * @returns
	 * 		The desired force to be applied to the vehicle.
	 */
	drive: function(vehicle, dt = 1)
	{
		const desired_velocity =
			this._target
				.subtract(vehicle.position)
				.unit_()
				.scale_(this._desired_speed);

		if (this._do_flee)
		{
			desired_velocity.negate_();
		}

		return (
			desired_velocity
				.subtract(vehicle.velocity)
				.scale_(vehicle.mass / dt)
		);
	},

	get target() { return this._target; },

	get desired_speed() { return this._desired_speed; },
	set desired_speed(value) { this._desired_speed = +value; },

	is_fleeing: function() { return this._do_flee; },
	flee: function() { this._do_flee = true; },
	seek: function() { this._do_flee = false; },
};


module.exports = Seek;

},{}],6:[function(require,module,exports){
/**
 * @author Raoul Harel
 * @license The MIT license (LICENSE.txt)
 * @copyright 2017 Raoul Harel
 * @url https://github.com/rharel/js-steering-behaviors
 */


const Vector = require('../math/Vector2');

/**
 * Drives a vehicle away from the central position of nearby sites.
 *
 * @param get_repulsion_sites
 *    Callback that evaluates and returns an array of positions that
 *    are considered to be 'nearby'. The callback accepts a single Vector2
 *    argument indicating the driven vehicle's current position.
 * @param repulsion_speed
 *    The desired speed when repulsed.
 * @constructor
 */
function Separate(get_repulsion_sites, repulsion_speed)
{
	this._get_repulsion_sites = get_repulsion_sites;
	this._seek = new SB.Behavior.Seek(new Vector(0, 0), repulsion_speed, true);
}
Separate.prototype =
{
	constructor: Separate,

	/**
	 * Drives the specified vehicle for the specified amount of time.
	 *
	 * @param vehicle
	 * 		The vehicle to drive.
	 * @param dt
	 * 		The drive's duration.
	 * @returns
	 * 		The desired force to be applied to the vehicle.
	 */
	drive: function(vehicle, dt = 1)
	{
		const sites = this._get_repulsion_sites(vehicle.position);

		if (sites.length === 0)
		{
			return vehicle.velocity.scale(-vehicle.mass / dt);
		}
		else
		{
			const average_position = new Vector(0, 0);
			sites.forEach(site => average_position.add_(site.position));
			average_position.scale(1 / sites.length);

			this._seek.target.assign(average_position);
			return this._seek.drive(vehicle, dt);
		}
	},

	get target() { return this._seek.target;},

	get repulsion_speed() { return this._seek.desired_speed; },
	set repulsion_speed(value) { this._seek.desired_speed = +value; }
};


module.exports = Separate;

},{"../math/Vector2":10}],7:[function(require,module,exports){
/**
 * @author Raoul Harel
 * @license The MIT license (LICENSE.txt)
 * @copyright 2017 Raoul Harel
 * @url https://github.com/rharel/js-steering-behaviors
 */


const Vector = require('../math/Vector2');

/**
 * Drives the vehicle in random directions.
 *
 * @param max_turn_rate
 *    Maximum change in turn angle from update to update.
 * @param max_turn_rate_change
 *    Maximum change in the turn rate from update to update.
 * @param speed
 *    Desired cruising speed.
 *
 * @constructor
 */
function Wander(max_turn_rate, max_turn_rate_change, speed)
{
	this._max_turn_rate = Math.abs(max_turn_rate);
	this._max_turn_rate_change = Math.abs(max_turn_rate_change);
	this._speed = speed;

	this._current_turn_rate = 0;
}
Wander.prototype =
{
	constructor: Wander,

	/**
	 * Drives the specified vehicle for the specified amount of time.
	 *
	 * @param vehicle
	 * 		The vehicle to drive.
	 * @param dt
	 * 		The drive's duration.
	 * @returns
	 * 		The desired force to be applied to the vehicle.
	 */
	drive: function(vehicle, dt = 1)
	{
		this._current_turn_rate += random_in_range
		(
			-this._max_turn_rate_change,
			this._max_turn_rate_change
		);
		this._current_turn_rate = Math.min
		(
			this._max_turn_rate,
			Math.max(-this._max_turn_rate, this._current_turn_rate)
		);
		const desired_velocity =
			Vector.X
				.rotate(vehicle.orientation + this._current_turn_rate)
				.scale_(this._speed);
		return (
			desired_velocity
				.subtract(vehicle.velocity)
				.scale_(vehicle.mass / dt)
		);
	},

	get max_turn_rate() { return this._max_turn_rate; },
	set max_turn_rate(value) { this._max_turn_rate = Math.abs(+value); },

	get speed() { return this._speed; },
	set speed(value) { this._speed = +value; }
};

/**
 * Generates a random number in the specified range.
 *
 * @param min
 * 		The range's lower bound.
 * @param max
 * 		The range's upper bound.s
 * @returns
 * 		A random number in the specified range.
 */
function random_in_range(min, max)
{
	return min + (max - min) * Math.random();
}


module.exports = Wander;

},{"../math/Vector2":10}],8:[function(require,module,exports){
/**
 * @author Raoul Harel
 * @license The MIT license (LICENSE.txt)
 * @copyright 2017 Raoul Harel
 * @url https://github.com/rharel/js-steering-behaviors
 */


const Vector = require('../math/Vector2');


/**
 * A vehicle's default properties.
 */
const DEFAULT_PROPERTIES =
{
	mass: 1,

	position: new Vector(0, 0),
	orientation: 0,

	velocity: new Vector(0, 0),

	max_thrust: 1,
	max_speed: 1
};
/**
 * Represents a point-mass vehicle capable of thrust.
 *
 * @constructor
 * @param user_properties
 *    An object describing the vehicle's properties and initial state,
 *    may contain any of the following keys:
 *      - mass {number}: Vehicle mass.
 *      - position {Vector2}: Initial position.
 *      - orientation {number}: Initial orientation angle (in radians).
 *      - velocity {Vector2}: Initial velocity.
 *      - max_thrust {number}: Maximum thrust.
 *      - max_speed {number}: Maximum speed.
 */
function Vehicle(user_properties = DEFAULT_PROPERTIES)
{
	const properties = Object.assign({}, DEFAULT_PROPERTIES, user_properties);

	this._mass = properties.mass;
	this._mass_inverse = 1 / this._mass;

	this._position = properties.position.clone();
	this._orientation = properties.orientation;
	this._velocity = properties.velocity.clone();

	this._max_thrust = properties.max_thrust;
	this._max_speed = properties.max_speed;

	this._net_force = new Vector(0, 0);
}
Vehicle.prototype =
{
	constructor: Vehicle,

	/**
	* Applies the specified force vector to the vehicle.
	*
	* @param F
	*    Force to apply.
	*/
	apply_force: function(F)
	{
		this._net_force.add_(F);
	},

	/**
	* Advances the vehicle in time.
	*
	* @details
	*    Uses forward Euler integration to compute new position and velocity.
	*    Also sets orientation to align with the new velocity's direction.
	*
	* @param dt
	*    The time duration to advance.
	*/
	step: function(dt)
	{
		truncate(this._net_force, this._max_thrust);
		const acceleration = this._net_force.scale(this._mass_inverse);

		this._velocity.add_(acceleration.scale(dt));
		truncate(this._velocity, this._max_speed);

		this._position.add_(this._velocity.scale(dt));

		if (this._velocity.squared_norm() > 0)
		{
			this._orientation = Vector.X.signed_angle_to(this._velocity);
		}
	},

	get position() { return this._position; },
	get orientation() { return this._orientation; },
	get velocity() { return this._velocity; },
	get net_force() { return this._net_force; },

	get mass() { return this._mass; },
	set mass(value)
	{
		this._mass = +value;
		this._mass_inverse = 1 / this._mass;
	},

	get max_thrust() { return this._max_thrust;},
	set max_thrust(value) { this._max_thrust = +value; },

	get max_speed() { return this._max_speed; },
	set max_speed(value) { this._max_speed = +value; }
};

/**
 * Performs magnitude truncation on a vector.
 * @param v
 * 		The vector to truncate.
 * @param upper_bound
 * 		The bounding value.
 * @returns
 * 		The truncated vector.
 */
function truncate(v, upper_bound)
{
	const norm = v.norm();
	if (norm > upper_bound)
	{
		v.scale_(upper_bound / norm);
	}

	return v;
}


module.exports = Vehicle;

},{"../math/Vector2":10}],9:[function(require,module,exports){
/**
 * @author Raoul Harel
 * @license The MIT license (LICENSE.txt)
 * @copyright 2017 Raoul Harel
 * @url https://github.com/rharel/js-steering-behaviors
 */


const Behavior =
{
	Arrive: require('./behaviors/Arrive'),
	Pursue: require('./behaviors/Pursue'),
	Seek: require('./behaviors/Seek'),
	Separate: require('./behaviors/Separate'),
	Wander: require('./behaviors/Wander'),
	Patrol: require('./behaviors/Patrol'),
	Align: require('./behaviors/Align')
};
const Vehicle = require('./core/Vehicle');
const Vector = require('./math/Vector2');
const Spatial =
{
	NaiveNN: require('./spatial/NaiveNearestNeighbour')
};
const Easing = require('./utility/Easing');
const Predictor = require('./utility/Predictor');

const SB =
{
	Behavior: Behavior,
	Vehicle: Vehicle,
	Vector: Vector,
	Spatial: Spatial,
	Easing: Easing,
	Predictor: Predictor
};


module.exports = SB;

if (window !== undefined)
{
	window.SB = SB;
}

},{"./behaviors/Align":1,"./behaviors/Arrive":2,"./behaviors/Patrol":3,"./behaviors/Pursue":4,"./behaviors/Seek":5,"./behaviors/Separate":6,"./behaviors/Wander":7,"./core/Vehicle":8,"./math/Vector2":10,"./spatial/NaiveNearestNeighbour":11,"./utility/Easing":12,"./utility/Predictor":13}],10:[function(require,module,exports){
/**
 * @author Raoul Harel
 * @license The MIT license (LICENSE.txt)
 * @copyright 2017 Raoul Harel
 * @url https://github.com/rharel/js-steering-behaviors
 */


/**
 * Represents a two-dimensional vector.
 *
 * @constructor
 * @param x
 * 		The vector's first coordinate.
 * @param y
 *		The vector's second coordinate.
 * @note
 *    Methods with suffix '_' (underscore) denote an in-place operation.
 */
function Vector2(x, y)
{
	this._x = x;
	this._y = y;
}
Vector2.prototype =
{
	constructor: Vector2,

	/**
	 * Performs negation.
	 */
	negate: function()
	{
		return this.scale(-1);
	},
	/**
	 * Performs negation (in-place).
	 */
	negate_: function()
	{
		return this.scale_(-1);
	},

	/**
	 * Performs element-wise addition.
	 */
	add: function(other)
	{
		return new Vector2
		(
			this._x + other._x,
			this._y + other._y
		);
	},
	/**
	 * Performs element-wise addition (in-place).
	 */
	add_: function(other)
	{
		this._x += other._x;
		this._y += other._y;

		return this;
	},

	/**
	 * Performs element-wise subtraction.
	 */
	subtract: function(other)
	{
		return new Vector2
		(
			this._x - other._x,
			this._y - other._y
		);
	},
	/**
	 * Performs element-wise subtraction (in-place).
	 */
	subtract_: function(other)
	{
		this._x -= other._x;
		this._y -= other._y;

		return this;
	},

	/**
	 * Performs element-wise multiplication.
	 */
	multiply: function(other)
	{
		return new Vector2
		(
	    	this._x * other._x,
	  		this._y * other._y
		);
	},
	/**
	 * Performs element-wise multiplication (in-place).
	 */
	multiply_: function(other)
	{
		this._x *= other._x;
		this._y *= other._y;

		return this;
	},

	/**
	 * Performs rotation by an angle_to.
	 *
	 * @param angle
	 * 		Angle of rotation (in radians).
	 */
	rotate: function(angle)
	{
		const sin = Math.sin(angle);
		const cos = Math.cos(angle);

		return new Vector2
		(
	  		this._x * cos - this._y * sin,
	  		this._x * sin + this._y * cos
		);
	},
	/**
	 * Performs rotation by an angle_to (in-place).
	 *
	 * @param angle
	 * 		Angle of rotation (in radians).
	 */
	rotate_: function(angle)
	{
		const sin = Math.sin(angle);
		const cos = Math.cos(angle);

		const x = this._x;
		this._x = x * cos - this._y * sin;
		this._y = x * sin + this._y * cos;

		return this;
	},

	/**
	 * Performs scaling.
	 */
	scale: function(scalar)
	{
		return new Vector2
		(
			this._x * scalar,
	  		this._y * scalar
		);
	},
	/**
	 * Performs scaling (in-place).
	 */
	scale_: function(scalar)
	{
		this._x *= scalar;
		this._y *= scalar;

		return this;
	},

	/**
	 * Computes the squared norm.
	 */
	squared_norm: function()
	{
		return this.dot(this);
	},
	/**
	 * Computes the norm.
	 */
	norm: function()
	{
		return Math.sqrt(this.squared_norm());
	},

	/**
	 * Computes the squared distance between vectors.
	 */
	squared_distance_to: function(other)
	{
		return this.subtract(other).squared_norm();
	},
	/**
	 * Computes the distance between vectors.
	 */
	distance_to: function(other)
	{
		return Math.sqrt(this.squared_distance_to(other));
	},

	/**
	 * Performs normalization.
	 */
	unit: function()
	{
		const n = this.norm();
		return (
			n === 0 ?
			this.clone() :
			this.scale(1 / n)
		);
	},
	/**
	 * Performs normalization (in-place).
	 */
	unit_: function()
	{
		const n = this.norm();
		return (
			n === 0 ?
			this :
			this.scale_(1 / n)
		);
	},

	/**
	 * Produces a clone of this.
	 */
	clone: function()
	{
		return new Vector2(this._x, this._y);
	},
	/**
	 * Assigns the values of another to this (in-place).
	 */
	assign: function(other)
	{
		this._x = other._x;
		this._y = other._y;

		return this;
	},

	/**
	 * Performs the dot product.
	 */
	dot: function(other)
	{
		return this._x * other._x +
			   this._y * other._y;
	},
	/**
	 * Performs the cross product.
	 */
	cross: function(other)
	{
		return this._x * other._y -
			   this._y * other._x;
	},

	/**
	 * Computes the angle_to between two vectors.
	 */
	angle_to: function(other)
	{
		return Math.acos
		(
			this.dot(other) /
			(this.norm() * other.norm())
		);
	},
	/**
	 * Computes the signed angle_to between two vectors.
	 */
	signed_angle_to: function(other)
	{
		return Math.atan2
		(
			this.cross(other),
			this.dot(other)
		);
	},

	/**
	 * Performs element-wise mapping.
	 *
	 * @param f
	 * 		The mapping function.
	 */
	map: function(f)
	{
		return new Vector2
		(
	    	f(this._x),
			f(this._y)
		);
	},
	/**
	 * Performs element-wise mapping (in-place).
	 *
	 * @param f
	 * 		The mapping function.
	 */
	map_: function(f)
	{
		this._x = f(this._x);
		this._y = f(this._y);

		return this;
	},

	/**
	 * Sets coordinate values for this (in-place).
	 */
	set: function(x, y)
	{
		this._x = x;
		this._y = y;

		return this;
	},

	get x() { return this._x; },
	set x(value) { this._x = +value; },

	get y() { return this._y; },
	set y(value) { this._y = +value; },

	toString: function()
	{
		return `Vector2(${this._x}, ${this._y})`;
	}
};

Vector2.ZERO = new Vector2(0, 0);
Vector2.X = new Vector2(1, 0);
Vector2.Y = new Vector2(0, 1);


module.exports = Vector2;

},{}],11:[function(require,module,exports){
/**
 * @author Raoul Harel
 * @license The MIT license (LICENSE.txt)
 * @copyright 2017 Raoul Harel
 * @url https://github.com/rharel/js-steering-behaviors
 */


/**
 * A naive data structure for nearest-neighbour queries.
 *
 * @constructor
 */
function NaiveNearestNeighbour()
{
	this._sites = {};  // Mapping: id => position
}
NaiveNearestNeighbour.prototype =
{
	constructor: NaiveNearestNeighbour,

	/**
	 * Sets a site's position.
	 *
	 * @param id
	 * 		The site's ID.
	 * @param position
	 * 		The site's position.
	 * @param data
	 * 		The data associated with the site (default is null).
	 */
	set_site_position: function(id, position, data = null)
	{
		this._sites[id] = { position: position, data: data };
	},
	/**
	 * Removes a site from the index.
	 *
	 * @param id
	 * 		The site's ID.
	 */
	remove_site: function(id)
	{
		delete this._sites[id];
	},

	/**
	 * Retrieve all sites that are within the specified distance from a specified
	 * query position.
	 *
	 * @param query
	 * 		The query position.
	 * @param radius
	 * 		The radius of the query.
	 * @returns
	 * 		An array of nearby sites.
	 */
	get_nearest_in_radius: function(query, radius)
	{
		let results = [];

		for (const id in this._sites)
		{
			if (!this._sites.hasOwnProperty(id)) { continue; }
			if (this._sites[id].position.distance_to(query) <= radius)
			{
				results.push(this._sites[id]);
			}
		}
		return results;
	}
};


module.exports = NaiveNearestNeighbour;

},{}],12:[function(require,module,exports){
/**
 * @author Raoul Harel
 * @license The MIT license (LICENSE.txt)
 * @copyright 2017 Raoul Harel
 * @url https://github.com/rharel/js-steering-behaviors
 */


module.exports =
{
	/**
	 * Computes the linear interpolation between two numbers at the specified
	 * time.
	 *
	 * @param a
	 * 		The first number.
	 * @param b
	 * 		The second number.
	 * @param t
	 * 		The time (0 <= t <= 1).
	 * @returns
	 * 		The interpolated value between the two numbers at the specified
	 * 		time.
	 */
	linear: function(a, b, t)
	{
		return a * (1 - t) + b * t;
	}
};

},{}],13:[function(require,module,exports){
/**
 * @author Raoul Harel
 * @license The MIT license (LICENSE.txt)
 * @copyright 2017 Raoul Harel
 * @url https://github.com/rharel/js-steering-behaviors
 */


/**
 * Compute a vehicle's future position given its current position and velocity.
 *
 * @param position
 * 		The vehicle's current position.
 * @param velocity
 * 		The vehicle's static velocity.
 * @param dt
 * 		The amount of time to look into the future.
 * @returns
 * 		The vehicle's position in the future.
 */
function compute_future_position(position, velocity, dt)
{
	return position.add(velocity.scale(dt));
}


module.exports =
{
	/**
	 * Creates a predictor function that approximates a vehicle's future position
	 * based on its current position and velocity (assuming the velocity remains
	 * static), and computing its position a specified amount of time
	 * into the future.
	 *
	 * @param dt
	 * 		The amount of time to look into the future.
	 * @returns
	 * 		A function: vehicle => future position
	 */
	static: function(dt)
	{
		return function(vehicle)
		{
			return compute_future_position
			(
				vehicle.position,
				vehicle.velocity,
				dt
			);
		};
	},
	/**
	 * Creates a predictor function that approximates a vehicle's future position
	 * based on its current position and velocity (assuming the velocity remains
	 * static), and computing its position a dynamic amount of time into the
	 * future. The amount of time to look ahead is retrieved from a specified
	 * function.
	 *
	 * @param get_dt
	 * 		The function which yields the amount of time to look ahead:
	 * 		() => number
	 * @returns {Function}
	 *		A function: vehicle => future position
	 */
	dynamic: function(get_dt)
	{
		return function(vehicle)
		{
			return compute_future_position
			(
				vehicle.position,
				vehicle.velocity,
				get_dt()
			);
		};
	}
};

},{}]},{},[9]);
