function Renderer(context, viewport, window)
{
	this._context = context;
	this._viewport = viewport;
	this._window = window;
}
Renderer.prototype =
{
	constructor: Renderer,

	begin: function()
	{
		this._context.save();

		// Flip vertical axis
		this._context.translate(0, this.canvas.height);
		this._context.scale(1, -1);

		// Align with screen window
		this._context.translate
		(	this._window.x,
			this._window.y
		);

		// Align with and scale to viewport
		this._context.scale
		(	this._window.width / this._viewport.width,
			this._window.height/ this._viewport.height
		);
		this._context.translate
		(	-this._viewport.x,
			-this._viewport.y
		);
	},
	end: function()
	{
		this._context.restore();
	},

	flush_canvas(color)
	{
		this._context.save();

		this._context.fillStyle = color;
		this._context.fillRect
		(	0, 0,
			this.canvas.width,
			this.canvas.height
		);

		this._context.restore();
	},

	draw_world: function(world, style)
	{
		this.flush_canvas("white");
		this.begin();
		this.draw_background(style.background_color);
		world.for_each_entity(entity =>
		{
			this.draw_disc
			(   entity.geometry,
				entity.body.position,
				entity.body.rotation,
				entity.style
			);
		});
		this.end();
	},
	draw_background(color)
	{
		this._context.save();

		this._context.fillStyle = color;
		this._context.fillRect
		(	this._viewport.x,
			this._viewport.y,
			this._viewport.width,
			this._viewport.height
		);

		this._context.restore();
	},
	draw_disc(disc, position, rotation, style)
	{
		this._begin_drawing(disc.center_of_mass, position, rotation, style);

		this._context.arc(disc.radius, disc.radius, disc.radius, 0, 2 * Math.PI);

		this._end_drawing(style);
	},
	draw_bounding_box(box, style)
	{
		const w = (box.right - box.left);
		const h = (box.top - box.bottom);
		const w2 = 0.5 * w;
		const h2 = 0.5 * h;
		this._begin_drawing
		(	{
				x: w2,
			  	y: h2
			},
			{
				x: box.left + w2,
				y: box.bottom + h2
			},
			0,
			style
		);

		this._context.rect(0, 0, w, h);

		this._end_drawing(style);
	},

	get context() { return this._context; },
	get canvas() { return this._context.canvas },
	get window() { return this._window; },
	get viewport() { return this._viewport; },

	_begin_drawing: function(pivot, position, rotation, style)
	{
		this._context.save();

		this._context.translate(position.x, position.y);
		this._context.rotate(rotation);
		this._context.translate(-pivot.x, -pivot.y);

		this._context.fillStyle = style.color;
		this._context.beginPath();
	},
	_end_drawing: function(style)
	{
		this._context.fill();
		this._context.restore();
	}
};

function Animation(on_start, on_frame, on_pause)
{
	this._on_start = on_start;
	this._on_frame = on_frame;
	this._on_pause = on_pause;

	this._frame_request = null;
}
Animation.prototype =
{
	start: function()
	{
		if (this.is_active) { return; }

		if (this._on_start) { this._on_start(this); }
		this._frame_request = requestAnimationFrame(() => this.step());
	},
	pause: function()
	{
		if (!this.is_active) { return; }

		cancelAnimationFrame(this._frame_request);
		this._frame_request = null;

		if (this._on_pause) { this._on_pause(this); }
	},
	step: function()
	{
		this._frame_request = requestAnimationFrame(() => this.step());
		if (this._on_frame)
		{
			if (this._on_frame(this)) { this.pause(); }
		}
	},

	get is_active() { return this._frame_request !== null; }
};
