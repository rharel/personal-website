/**
 * Animate Gol.World-s
 */


(function() {

    /**
     * Create a new animation.
     *
     * @param fps Target frames per second.
     * @param duration Duration in #frames. Specify a negative value to signify no end.
     * @constructor
     */
    function Animation(fps, duration) {

        this._interval = 1000 / fps;
        this._duration = duration;
        this._t = 0;
        this._world = null;
        this._view = null;
        this._on_end = null;
        this._in_progress = false;
    }

    Animation.prototype = {

        constructor: Animation,

        /**
         * Start the animation.
         *
         * @param world Gol.World to animate.
         * @param view Gol.CanvasView to render the animation.
         * @param callback [optional] Callback called when animation ends.
         *
         * @note Always stop() any ongoing animation before calling this.
         * @note callback does not trigger when stop() is called unless explicitly specified.
         *                See the documentation for stop().
         */
        animate: function(world, view, callback) {

            this._world = world;
            this._view = view;
            this._on_end = callback;
            this._t = 0;

            if (this._world instanceof Gol.World &&
                this._view instanceof Gol.CanvasView) {

                this._in_progress = true;
                this._step();
            }
        },

        /**
         * Stops the animation.
         *
         * @param invoke_callback Set to true if you wish to invoke the callback specified
         *                        in the call to animate(). Default value is false.
         */
        stop: function(invoke_callback) {

            if (!this._in_progress) { return; }

            this._in_progress = false;

            if (invoke_callback && this._on_end !== null) {

                this._on_end();
            }

            this._world = null;
            this._view = null;
            this._on_end = null;
            this._t = 0;
        },

        _step: function() {

            setTimeout(

                function() {

                    if (!this._in_progress ||
                         this._t === this._duration) {

                        this.stop(true);
                        return;
                    }

                    if (this._t >= 0) { ++ this._t; }

                    this._world.step();
                    this._view.render(this._world);

                    requestAnimationFrame(this._step.bind(this));
                }.bind(this),
                this._interval
            );
        },

        get fps() { return 1000 / this._interval; },
        set fps(value) { this._interval = 1000 / (+value); },

        get duration() { return this._duration; },
        set duration(value) { this._duration = +value; }
    };

    if (typeof window.Gol === 'undefined') { window.Gol = {}; }
    window.Gol.Animation = Animation;
})();
