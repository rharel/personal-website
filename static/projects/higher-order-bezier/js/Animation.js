/**
 * Animate Bezier.Curve-s
 */


(function() {

    /**
     * Create a new animation.
     *
     * @param fps Target frames per second.
     * @param duration Duration in #frames. Specify a negative value to signify no end (loop).
     * @param step_size Step size per frame (in (0, 1]).
     * @constructor
     */
    function Animation(fps, duration, step_size) {

        this._interval = 1000 / fps;
        this._duration = duration;
        this._step_size = step_size;
        this._frame = 0;
        this._view = null;
        this._on_end = null;
        this._in_progress = false;
    }

    Animation.prototype = {

        constructor: Animation,

        /**
         * Start the animation.
         *
         * @param view Bezier.CanvasView to render the animation.
         * @param callback [optional] Callback called when animation ends.
         *
         * @note Always stop() any ongoing animation before calling this.
         * @note callback does not trigger when stop() is called unless explicitly specified.
         *                See the documentation for stop().
         */
        animate: function(view, callback) {

            this._view = view;
            this._on_end = callback;
            this._frame = 0;
            this._view.shell.t = 0;
            this._view.outline.t = 0;

            if (this._view instanceof Bezier.CanvasView) {

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

            this._on_end = null;
            this._frame = 0;
            this._view.shell.t = 0;
            this._view.outline.t = 0;
            this._view = null;

        },

        _step: function() {

            setTimeout(

                function() {

                    if (!this._in_progress ||
                         this._frame === this._duration) {

                        this.stop(true);
                        return;
                    }

                    if (this._frame >= 0) { ++ this._frame; }

                    var t = (this._view.shell.t + this._step_size) % 1;
                    this._view.shell.t = t;
                    this._view.outline.t = t;
                    this._view.render();

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

    if (typeof window.Bezier !== 'undefined') {

        window.Bezier.Animation = Animation;
    }
})();
