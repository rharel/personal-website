(function()
{
// Ties the playback of an audio clip to an animated canvas.
function AudioClipAnimation(audio_clip, canvas)
{
	this._canvas = canvas;
	this._audio_clip = audio_clip;

	this._graphics_context = this._canvas.getContext("2d");
	this._requested_animation_frame = null;

	this._animation_frame_event_listeners = [];
	this._animation_stop_event_listeners = [];

	this._audio_clip.on_stop(() =>
	{
		cancelAnimationFrame(this._requested_animation_frame);
		this._dispatch_animation_stop_event();
	});
}
AudioClipAnimation.prototype =
{
	constructor: AudioClipAnimation,

	toggle_play: function()
	{
		if (this.is_playing) { this.stop(); }
		else { this.play(); }
	},
	play: function()
	{
		if (this.is_playing) { return; }

		this._requested_animation_frame =
		(
			requestAnimationFrame(() => this._animate())
		);
		this._audio_clip.play();
	},
	stop: function()
	{
		if (!this.is_playing) { return; }

		this._audio_clip.stop();
	},

	on_animation_frame: function(listener)
	{
		this._animation_frame_event_listeners.push(listener);
	},
	on_animation_stop: function(listener)
	{
		this._animation_stop_event_listeners.push(listener);
	},

	get audio_clip() { return this._audio_clip; },
	get canvas() { return this._canvas; },

	get graphics_context() { return this._graphics_context; },

	get is_playing() { return this._audio_clip.is_playing; },

	_animate: function()
	{
		if (!this.is_playing) { return; }

		this._requested_animation_frame =
		(
			requestAnimationFrame(() => this._animate())
		);
		this._dispatch_animation_frame_event();
	},

	_dispatch_animation_frame_event: function()
	{
		this._animation_frame_event_listeners
			.forEach(callback => callback(this));
	},
	_dispatch_animation_stop_event: function()
	{
		this._animation_stop_event_listeners
			.forEach(callback => callback(this));
	}
};
AudioClipAnimation.for_time_domain = function(audio_clip, canvas, style = {})
{
	const animation = new AudioClipAnimation(audio_clip, canvas);
	const data = new Uint8Array(audio_clip.fft_bin_count);

	draw_flat_line();
	animation.on_animation_frame(() =>
	{
		audio_clip.route.get_byte_time_data(data);
		draw_time_domain();
	});

	return { animation: animation, data: data };

	function draw_flat_line()
	{
		draw_line_strip([128, 128], animation.graphics_context, style);
	}
	function draw_time_domain()
	{
		draw_line_strip(data, animation.graphics_context, style);
	}
};
AudioClipAnimation
	.for_frequency_domain = function(audio_clip, canvas, visible_range, style = {})
{
	const animation = new AudioClipAnimation(audio_clip, canvas);
	const data = new Uint8Array(audio_clip.fft_bin_count);

	draw_background(animation.graphics_context, style.background_color);
	animation.on_animation_frame(() =>
	{
		audio_clip.route.get_byte_frequency_data(data);
		draw_frequency_domain();
	});

	return { animation: animation, data: data };

	function draw_frequency_domain()
	{
		draw_bars(data, visible_range, animation.graphics_context, style);
	}
};

// Colors over the entire context with a specified color.
function draw_background(graphics_context, color = "white")
{
	graphics_context.save();

	graphics_context.fillStyle = color;
	graphics_context.fillRect
	(
		0, 0,
		graphics_context.canvas.width,
		graphics_context.canvas.height
	);

	graphics_context.restore();
}

const DEFAULT_LINE_STRIP_DRAWING_STYLE =
	{
		background_color: "white",
		line_color: "black",
		line_width: 1,
	};
// Draw a connected line strip visualization of the specified data.
function draw_line_strip
(
	data,  // Uint8Array
	graphics_context,
	style = {})
{
	const canvas_width = graphics_context.canvas.width;
	const canvas_height = graphics_context.canvas.height;

	style = Object.assign(DEFAULT_LINE_STRIP_DRAWING_STYLE, style);

	draw_background(graphics_context, style.background_color);

	graphics_context.save();
	graphics_context.strokeStyle = style.line_color;
	graphics_context.lineWidth = style.line_width;

	const spacing = canvas_width / (data.length - 1);
	graphics_context.beginPath();
	graphics_context.moveTo(0, canvas_height * data[0] / 255);
	for(let i = 1; i < data.length; ++i)
	{
		const x = i * spacing;
		const y = canvas_height * data[i] / 255;

		graphics_context.lineTo(x, y);
	}
	graphics_context.stroke();
	graphics_context.restore();
}

const DEFAULT_BAR_DRAWING_STYLE =
{
	background_color: "white",
	bar_color: "black",
	bar_height_scale: 1.0
};
// Draw a bar graph visualization of the specified data.
function draw_bars
(
	data,  // Uint8Array
	range,  // {min: Integer, max: Integer}
	graphics_context,
	style = {})
{
	const range_size = range.max - range.min;

	const canvas_width = graphics_context.canvas.width;
	const canvas_height = graphics_context.canvas.height;

	style = Object.assign(DEFAULT_BAR_DRAWING_STYLE, style);

	draw_background(graphics_context, style.background_color);

	graphics_context.save();
	graphics_context.fillStyle = style.bar_color;

	const bar_width = (canvas_width / range_size);
	const bar_scale = style.bar_height_scale * canvas_height;

	for(let i = 0; i < range_size; ++i)
	{
		const bar_height = data[range.min + i] / 255 * bar_scale;
		if (bar_height < 1) { continue; }  // bar is too tiny to draw

		const x = i * bar_width;
		const y = canvas_height - bar_height;

		graphics_context.fillRect(x, y, bar_width, bar_height);
	}
	graphics_context.restore();
}

window.Visualization =
{
	AudioClipAnimation: AudioClipAnimation,

	draw_background: draw_background,
	draw_line_strip: draw_line_strip,
	draw_bars: draw_bars,
};
})();
