/**
 * Operates animated behavior figures.
 *
 * @author Raoul Harel
 * @url www.rharel.com
 */

(function()
{
	const clips =
	{
		'seek-animation':
		{
			canvas_size: new SB.Vector(250, 70),
			canvas: null,
			context: null,
			agents:
			[
				{
					vehicle: new SB.Vehicle
					({
						position: new SB.Vector(30, 35),
						max_thrust: 400,
						max_speed: 400
					}),
					behavior: new SB.Behavior.Seek(new SB.Vector(125, 35), 400)
				}
			],
			simulation: null,
			animation: new Animation(60, 5 * 60)
		},
		'flight-animation':
		{
			canvas_size: new SB.Vector(250, 70),
			canvas: null,
			context: null,
			agents:
			[
				{
					vehicle: new SB.Vehicle
					({
						position: new SB.Vector(75, 35),
						max_thrust: 400,
						max_speed: 400
					}),
					behavior: new SB.Behavior.Seek(new SB.Vector(125, 35), 400, true)
				}
			],
			simulation: null,
			animation: new Animation(60, 4.5 * 60)
		},
		'wander-animation':
		{
			canvas_size: new SB.Vector(250, 250),
			canvas: null,
			context: null,
			agents:
			[
				{
					vehicle: new SB.Vehicle
					({
						position: new SB.Vector(75, 75),
						max_thrust: 200,
						max_speed: 200
					}),
					behavior: new SB.Behavior.Wander(0.1 * Math.PI, 0.001 * Math.PI, 200)
				}
			],
			simulation: null,
			animation: new Animation(60, 5 * 60)
		},
		'pursue-animation':
		{
			canvas_size: new SB.Vector(250, 250),
			canvas: null,
			context: null,
			agents:
			[
				{
					vehicle: new SB.Vehicle
					({
						position: new SB.Vector(200, 125),
						max_thrust: 200,
						max_speed: 100
					}),
					behavior: new SB.Behavior.Wander(0.1 * Math.PI, 0.001 * Math.PI, 100)
				}
			],
			simulation: null,
			animation: new Animation(60, 10 * 60),
			initialize: clip =>
			{
				const simulation = clip.simulation;
				simulation.agents.push(
				{
					vehicle: new SB.Vehicle
					({
						position: new SB.Vector(50, 50),
						max_thrust: 200,
						max_speed: 90
					}),
					behavior: new SB.Behavior.Pursue
					(
						() => simulation.agents[0].vehicle.position.clone(),
						90
					),
					style: { fill: 'darkorange' }
				});
				simulation.agents.push(
				{
					vehicle: new SB.Vehicle
					({
						position: new SB.Vector(50, 200),
						max_thrust: 200,
						max_speed: 200
					}),
					behavior: new SB.Behavior.Pursue
					(
						() => simulation.agents[0].vehicle.position.clone(),
						200, true
					),
					style: { fill: 'lightblue' }
				});
			}
		},
		'naive-pursuit-animation':
		{
			canvas_size: new SB.Vector(250, 150),
			canvas: null,
			context: null,
			agents:
			[
				{
					vehicle: new SB.Vehicle
					({
						position: new SB.Vector(25, 25),
						max_thrust: 200,
						max_speed: 100
					}),
					behavior: new SB.Behavior.Seek(new SB.Vector(250, 25), 100)
				}
			],
			simulation: null,
			animation: new Animation(60, 2 * 60),
			initialize: clip =>
			{
				const simulation = clip.simulation;
				simulation.agents.push(
				{
					vehicle: new SB.Vehicle
					({
						position: new SB.Vector(125, 125),
						max_thrust: 200,
						max_speed: 90
					}),
					behavior: new SB.Behavior.Pursue
					(
						() => simulation.agents[0].vehicle.position.clone(),
						90
					),
					style: { fill: 'darkorange' }
				});
			}
		},
		'smart-pursuit-animation':
		{
			canvas_size: new SB.Vector(250, 150),
			canvas: null,
			context: null,
			agents:
			[
				{
					vehicle: new SB.Vehicle
					({
						position: new SB.Vector(25, 25),
						max_thrust: 200,
						max_speed: 100
					}),
					behavior: new SB.Behavior.Seek(new SB.Vector(250, 25), 100)
				}
			],
			simulation: null,
			animation: new Animation(60, 2 * 60),
			initialize: clip =>
			{
				const simulation = clip.simulation;
				simulation.agents.push(
				{
					vehicle: new SB.Vehicle
					({
						position: new SB.Vector(125, 125),
						max_thrust: 200,
						max_speed: 90
					}),
					behavior: SB.Behavior.Pursue.vehicle
					(
						simulation.agents[0].vehicle,
						90,
						SB.Predictor.static(1.0)
					),
					style: { fill: 'darkorange' }
				});
			}
		},
		'arrive-animation':
		{
			canvas_size: new SB.Vector(250, 70),
			canvas: null,
			context: null,
			agents:
			[
				{
					vehicle: new SB.Vehicle
					({
						position: new SB.Vector(30, 35),
						max_thrust: 400,
						max_speed: 200
					}),
					behavior: new SB.Behavior.Arrive(new SB.Vector(200, 35), 200, 75)
				}
			],
			simulation: null,
			animation: new Animation(60, 2 * 60)
		},
		'separate-animation':
		{
			canvas_size: new SB.Vector(250, 70),
			canvas: null,
			context: null,
			agents: [],
			simulation: null,
			animation: new Animation(60, 60),
			initialize: clip =>
			{
				const NaiveNN = new SB.Spatial.NaiveNN();
				const get_NN = position => NaiveNN
					.get_nearest_in_radius(position, 100)
					.filter(item => item.position !== position);
				const separate = new SB.Behavior.Separate(get_NN, 200);

				clip.simulation.agents.push(
				{
					vehicle: new SB.Vehicle
					({
						position: new SB.Vector(110, 35),
						max_thrust: 400,
						max_speed: 200
					}),
					behavior: separate
				});
				clip.simulation.agents.push(
				{
					vehicle: new SB.Vehicle
					({
						position: new SB.Vector(140, 35),
						max_thrust: 400,
						max_speed: 200
					}),
					behavior: separate
				});
				clip.simulation.agents.forEach((agent, i) =>
				{
					NaiveNN.set_site_position(i, agent.vehicle.position);
				});
			}
		},
		'patrol-animation':
		{
			canvas_size: new SB.Vector(250, 140),
			canvas: null,
			context: null,
			agents:
			[
				{
					vehicle: new SB.Vehicle
					({
						position: new SB.Vector(25, 35),
						max_thrust: 300,
						max_speed: 200
					}),
					behavior: new SB.Behavior.Patrol
					(
						[
							new SB.Vector(225, 35),
							new SB.Vector(225, 105),
							new SB.Vector(25, 105),
							new SB.Vector(25, 35)
						],
						200, 100, 5, true
					)
				}
			],
			simulation: null,
			animation: new Animation(60, 8 * 60)
		},
		'align-animation':
		{
			canvas_size: new SB.Vector(250, 100),
			canvas: null,
			context: null,
			agents: [],
			simulation: null,
			animation: new Animation(60, 5 * 60),
			initialize: clip =>
			{
				const NaiveNN = new SB.Spatial.NaiveNN();
				const get_NN = position => NaiveNN
					.get_nearest_in_radius(position, 75)
					.filter(item => item.position !== position);

				clip.simulation.agents.push(
				{
					vehicle: new SB.Vehicle
					({
						position: new SB.Vector(25, 25),
						max_thrust: 100,
						max_speed: 200
					}),
					behavior: new SB.Behavior.Seek(new SB.Vector(250, 25), 200),
					style: { fill: 'lightgreen' }
				});
				clip.simulation.agents.push(
				{
					vehicle: new SB.Vehicle
					({
						position: new SB.Vector(125, 75),
						max_thrust: 400,
						max_speed: 200
					}),
					behavior: new SB.Behavior.Align(get_NN),
					style: { fill: 'yellow' }
				});
				clip.simulation.agents.forEach((agent, i) =>
				{
					NaiveNN.set_site_position
					(
						i,
						agent.vehicle.position,
						{ velocity: agent.vehicle.velocity }
					);
				});
			}
		}
	};

	const renderer = new SB.Renderer();

	function reset(clip)
	{
		clip.simulation.clear();
		clip.agents.forEach(template =>
		{
			const agent = Object.assign({}, template);
			agent.vehicle = new SB.Vehicle
			({
				position: template.vehicle.position.clone(),
				max_thrust: template.vehicle.max_thrust,
				max_speed: template.vehicle.max_speed
			});
			clip.simulation.agents.push(agent);
		});
		if (clip.initialize !== undefined)
		{
			clip.initialize(clip);
		}
		render(clip.context, clip.simulation);
	}

	function render(context, simulation)
	{
		renderer.render_background(context);
		simulation.agents.forEach(agent =>
		{
			renderer.render_vehicle(context, agent.vehicle, agent.style);
		});
	}

	function toggle_animation(clip_id)
	{
		const clip = clips[clip_id];
		const overlay = clip.canvas.nextElementSibling;

		if (overlay.style.opacity !== '0')  // start
		{
			overlay.style.opacity = '0';
			clip.animation.start
			(
				() =>
				{
					clip.simulation.step(clip.animation.interval / 1000);
					render(clip.context, clip.simulation);
				},
				() => toggle_animation(clip_id)
			);
		}
		else  // stop
		{
			overlay.style.opacity = '1';
			clip.animation.stop();
			reset(clip);
		}
	}

	function initialize()
	{
		for (const id in clips)
		{
			if (!clips.hasOwnProperty(id)) { continue; }

			const clip = clips[id];
			clip.canvas = document.getElementById(id);
			clip.canvas.width = clip.canvas_size.x;
			clip.canvas.height = clip.canvas_size.y;
			clip.context = clip.canvas.getContext('2d');
			clip.simulation = new SB.Simulation
			(
				clip.canvas.width,
				clip.canvas.height
			);
			reset(clip);
		}
	}
	window.SB.toggle_animation = toggle_animation;
	window.addEventListener('load', initialize);
})();
