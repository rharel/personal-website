{
function random_in_range(lower, upper)
{
	return lower + Math.random() * (upper - lower);
}

const WORLD_DRAWING_STYLE = { background_color: "rgb(240, 240, 240)" };
const WORLD_TIME_STEP = 1 / 60;
const STATIC_MASS = Math.pow(10, 14);

function register_figure_animation(canvas_id, frame_count, build_world, on_step_end)
{
	const canvas = document.getElementById(canvas_id);
	const context = canvas.getContext("2d");
	const play_button = canvas.parentElement.lastElementChild;

	let frame_index;
	let world;

	const viewport = { x: 0, y: 0, width: 10, height: 10 * canvas.height / canvas.width };
	const renderer = new Renderer
	(   context,
		viewport,
		// window:
		{
			x: 0, y: 0,
			width: canvas.width,
			height: canvas.height
		}
	);
	const animation = new Animation
	(
		// On start:
		() =>
		{
			frame_index = 0;
			play_button.style.opacity = "0";
		},
		// On frame:
		() =>
		{
			if (frame_index >= frame_count) { return true; }  // pause

			world.step(WORLD_TIME_STEP);
			renderer.draw_world(world, WORLD_DRAWING_STYLE);
			if (on_step_end) { on_step_end(renderer); }

			++ frame_index;

			return false;
		},
		// On pause:
		() =>
		{
			play_button.style.opacity = "1";
			preview();
		}
	);
	play_button.addEventListener("click", () =>
	{
		if (animation.is_active) { animation.pause(); }
		else                     { animation.start(); }
	});

	function preview()
	{
		world = build_world(viewport);
		world.initialize();
		renderer.draw_world(world, WORLD_DRAWING_STYLE);
	}
	preview();
}
function register_showcase()
{
	const particle_count = 20;
	const radius_range = {min: 0.4, max: 0.8};
	const elasticity = 0.8;
	const palette = ["red", "green", "blue", "purple", "orange", "brown"];

	let particles;
	let viewport;

	register_figure_animation
	(	"showcase-canvas", 5 * 60,
		vp =>
		{
			particles = [];
			viewport = vp;

			const world = new Physics.World({do_step_piecewise: true});

			// Spawn floor:
			const floor = world.spawn(1, viewport.width, elasticity);
			floor.is_static = true;
			floor.body.position.x = 0.5 * viewport.width;
			floor.body.position.y = -viewport.width + 2;
			floor.style = { color: "#a56729" };

			// Spawn particles:
			let spawn_y = viewport.height;
			for (let i = 0; i < particle_count; ++i)
			{
				const radius = random_in_range(radius_range.min, radius_range.max);
				const mass = Math.PI * radius * radius;

				const particle = world.spawn(mass, radius, elasticity);

				spawn_y += radius;
				particle.body.position.x = 0.5 * viewport.width;
				particle.body.position.y = spawn_y;
				spawn_y += radius + radius_range.min;

				particle.applied_force = new Physics.Vector(0, -10);
				particle.body.velocity.x = random_in_range(-0.1, 0.1);

				particle.style = { color: palette[i % palette.length] };
				particles.push(particle);
			}

			return world;
		},
		() =>
		{
			particles.forEach(particle =>
			{
				const p = particle.body.position;
				const v = particle.body.velocity;
				const r = particle.geometry.radius;

				if (v.length_squared() === 0) { return; }
				if (p.x < r)                  { p.x = r; v.x *= -1; }
				if (p.x > viewport.width - r) { p.x = viewport.width - r; v.x *= -1 }
			});
		}
	);
}
function register_collision_elasticity_figures()
{
	const mass = [4, 1];
	const radius = [1.2, 0.8];
	const padding = 1;
	const palette = ["red", "blue"];
	const speed = 4;

	function register_figure(canvas_id, frame_count, elasticity)
	{
		register_figure_animation
		(	canvas_id, frame_count,
			viewport =>
			{
				const world = new Physics.World({do_step_piecewise: true});

				const a = world.spawn(mass[0], radius[0], elasticity);
				a.body.position.x = radius[0] + padding;
				a.body.position.y = 0.5 * viewport.height;
				a.body.velocity.x = speed;
				a.style = { color: palette[0] };

				const b = world.spawn(mass[1], radius[1], elasticity);
				b.body.position.x = viewport.width - (radius[1] + padding);
				b.body.position.y = 0.5 * viewport.height;
				b.body.velocity.x = -speed;
				b.style = { color: palette[1] };

				return world;
			}
		);
	}
	register_figure("fig1-elastic-collision-canvas",      3 * 60, 1);
	register_figure("fig1-inelastic-collision-canvas",    3 * 60, 0.01);
}
function register_quadtree_figure()
{
	const particle_count = 10;
	const radius = 0.35;
	const speed = 2;
	const palette = ["red", "green", "blue", "purple", "orange", "brown"];
	const leaf_highlight_style = {color: "rgba(150, 150, 255, 0.5)"};

	let quadtree;
	let world;
	let viewport;

	register_figure_animation
	(	"fig2-canvas", 10 * 60,
		vp =>
		{
			viewport = vp;
			quadtree = new Physics.Quadtree
			(	4,
				Physics.BoundingBox.from_center_and_size
				(	viewport.width / 2, viewport.height / 2,
					viewport.width,     viewport.height
				)
			);
			world = new Physics.World
			({	broadphase: new Physics.QuadtreeBroadphase(quadtree),
				do_step_piecewise: false
			});

			for (let i = 0; i < particle_count; ++i)
			{
				const particle = world.spawn(1, radius);

				particle.body.position.x = random_in_range(radius, viewport.width - radius);
				particle.body.position.y = random_in_range(radius, viewport.height - radius);

				particle.body.velocity = new Physics.Vector()
					.map(_ => random_in_range(-1, 1))
					.set_length(speed);

				particle.style = { color: palette[i % palette.length] };
			}
			return world;
		},
		renderer =>
		{
			world.for_each_entity(particle =>
			{
				const p = particle.body.position;
				const v = particle.body.velocity;

				if (p.x < radius) { p.x = radius; v.x *= -1; }
				if (p.x > viewport.width - radius) { p.x = viewport.width - radius; v.x *= -1 }
				if (p.y < radius) { p.y = radius; v.y *= -1; }
				if (p.y > viewport.height - radius) { p.y = viewport.height - radius; v.y *= -1 }
			});
			renderer.begin();
			quadtree.for_each_leaf_with_at_least(2, node =>
			{
				renderer.draw_bounding_box(node.bounds, leaf_highlight_style);
			});
			renderer.end();
		}
	);
}
window.initialize_figure_animations = function()
{
	register_showcase();
	register_collision_elasticity_figures();
	register_quadtree_figure();
}
}
