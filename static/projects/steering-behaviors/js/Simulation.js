/**
 * @author Raoul Harel
 * @license The MIT license (LICENSE.txt)
 * @copyright 2017 Raoul Harel
 * @url https://github.com/rharel/js-steering-behaviors
 */


(function()
{
function Simulation(world_width, world_height, padding = 5)
{
	this._world_size = new SB.Vector(world_width, world_height);
	this._padding = padding;
	this._agents = [];
}
Simulation.EPSILON = 0.001;
Simulation.prototype =
{
	constructor: Simulation,

	clear: function()
	{
		this._agents = [];
	},
	step: function(dt)
	{
		this._agents.forEach(agent =>
		{
			const vehicle = agent.vehicle;
			const behavior = agent.behavior;

			vehicle.net_force.set(0, 0);
			vehicle.apply_force(behavior.drive(vehicle, dt));
			vehicle.step(dt);

			this._enforce_world_bounds(vehicle.position);
			this._discard_small_values(vehicle.velocity);
		});
	},
	_enforce_world_bounds: function(position)
	{
		const p = position;
		if (p.x < 0 || p.x > this._world_size.x)
		{
			p.x = this._world_size.x - p.x;
			p.x = Math.min
			(
				this._world_size.x - this._padding,
				Math.max(this._padding, p.x)
			);
		}
		if (p.y < 0 || p.y > this._world_size.y)
		{
			p.y = this._world_size.y - p.y;
			p.y = Math.min
			(
				this._world_size.y - this._padding,
				Math.max(this._padding, p.y)
			);
		}
	},
	_discard_small_values: function(v)
	{
		v.map_(x => Math.abs(x) < Simulation.EPSILON ? 0 : x);
	},

	get world_size() { return this._world_size; },
	get agents() { return this._agents; }
};

window.SB.Simulation = Simulation;
})();
