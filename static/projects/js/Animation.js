/**
 * Animation clip
 */


(function()
{
/**
 * Creates a new animation.
 *
 * @param fps
 * 		Target frames per second.
 * @param duration
 * 		Duration in #frames. Specify a negative value to signify no end (loop).
 * @constructor
 */
function Animation(fps, duration)
{
	this._interval = 1000 / fps;
	this._duration = duration;
	this._frame = 0;
	this._in_progress = false;
	this._on_step = null;
	this._on_end = null;
}
Animation.prototype =
{
	constructor: Animation,

	/**
	 * Starts the animation.
	 *
	 * @param on_step
	 * 		Callback to be called during each animation step.
	 * @param on_end
	 * 		Callback to be called when animation ends.
	 *
	 * @note
	 * 		Always stop() any ongoing animation before calling this.
	 * @note
	 * 		on_end() does not trigger when stop() is called unless explicitly specified.
	 * 		See the documentation for stop().
	 */
	start: function(on_step, on_end)
	{
		this._on_step = on_step;
		this._on_end = on_end;
		this._frame = 0;

		this._in_progress = true;
		this._step();
	},
	/**
	 * Stops the animation.
	 *
	 * @param invoke_callback
	 * 		Set to true if you wish to invoke the callback specified
	 *      in the call to start(). Default value is false.
	 */
	stop: function(invoke_callback = false) {

		if (!this._in_progress) { return; }

		this._in_progress = false;

		if (invoke_callback && this._on_end !== null)
		{
			this._on_end();
		}

		this._frame = 0;
		this._on_step = null;
		this._on_end = null;
	},

	_step: function()
	{
		setTimeout(
			function()
			{
				if (!this._in_progress ||
					 this._frame === this._duration)
				{
					this.stop(true);
					return;
				}
				if (this._frame >= 0) { ++ this._frame; }

				this._on_step();

				requestAnimationFrame(this._step.bind(this));
			}.bind(this),
			this._interval
		);
	},

	get interval() { return this._interval; },
	set interval(value) { this._interval = +value; },

	get fps() { return 1000 / this._interval; },
	set fps(value) { this._interval = 1000 / (+value); },

	get duration() { return this._duration; },
	set duration(value) { this._duration = +value; }
};

window.Animation = Animation;
})();
