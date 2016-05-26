/**
 * @author Raoul Harel
 * @license The MIT license (LICENSE.txt)
 * @copyright 2015 Raoul Harel
 * @url https://github.com/rharel/js-bezier
 */

(function () {

    function Vector2(x, y) {

        this._x = +x;
        this._y = +y;
    }
    Vector2.copy = function(source) {

        return new Vector2(source.x, source.y);
    };
    Vector2.prototype = {

        constructor: Vector2,

        min: function () {
            return new Vector2(-this.x, -this.y);
        },

        add: function (other) {

            return new Vector2(this.x + other.x, this.y + other.y);
        },
        addS: function (scalar) {

            return new Vector2(this.x + scalar, this.y + scalar);
        },

        sub: function (other) {
            return this.add(other.min());
        },
        subS: function (scalar) {
            return this.addS(-scalar);
        },

        mul: function (other) {

            return new Vector2(this.x * other.x, this.y * other.y);
        },
        mulS: function (scalar) {

            return new Vector2(this.x * scalar, this.y * scalar);
        },

        dot: function (other) {

            return this.x * other.x + this.y * other.y;
        },
        angle: function (other) {

            return Math.acos(this.dot(other) / (this.length * other.length));
        },

        get x() {
            return this._x;
        },
        set x(value) {
            this._x = +value;
        },

        get y() {
            return this._y;
        },
        set y(value) {
            this._y = +value;
        },

        get length2() {
            return this.dot(this);
        },
        get length() {
            return Math.sqrt(this.length2);
        }
    };

    /**
     * Create a new curve from an array of control points.
     *
     * @param points [optional] Array of objects {x:, y:}.
     */
    function Curve(points) {

        this._points = [];

        if (points) {

            points.forEach(function(p) {

                this.add(p.x, p.y);
            }.bind(this));
        }
    }
    Curve.prototype = {

        constructor: Curve,

        _out_of_time_bounds: function(t) {

            return t < 0 || t > 1;
        },
        _pack: function (p, t) {

            return {x: p.x, y: p.y, t: t};
        },

        /**
         * Adds a control point to this.
         * @returns {Vector2} Newly added point.
         */
        add: function (x, y) {

            var p = new Vector2(x, y);

            this._points.push(p);

            return p;
        },

        /**
         * Removes all control points from this.
         */
        clear: function () {

            this._points = [];
        },

        /**
         * Evaluates this at given time.
         *
         * @param t Float in [0, 1].
         *
         * @returns Object {x:, y:, t:}, or null if complexity == 0.
         */
        at: function (t) {

            if (this._out_of_time_bounds(t) || this.complexity === 0) {

                return null;
            }

            else if (this.complexity === 1) {

                return this._pack(this._points[0], t);
            }

            else {

                var shell = this.shell(t);

                return this._pack(shell[shell.length - 1][0], t);
            }
        },

        /**
         * Extract a sequence of vertices describing this in time range [t0, t1].
         *
         * @param t0 Start time in [0, 1]
         * @param t1 End time in [0, 1]
         *
         * @param precision
         *    Vertices are equally spaced in time by this amount (precision > 0).
         *
         * @returns {Array} Array of vertices in order.
         */
        outline: function (t0, t1, precision) {

            if (this._out_of_time_bounds(t0) ||
                this._out_of_time_bounds(t1) ||
                precision <= 0) {

                return [];
            }

            if (this.complexity === 0 || t1 < t0) {

                return [];
            }

            else if (this.complexity === 1) {

                return [this.at(0)];
            }

            else {

                var skeleton = [];
                for (var t = t0; t < t1; t += precision) {

                    skeleton.push(this.at(t));
                }
                skeleton.push(this.at(t1));

                return skeleton;
            }
        },

        /**
         * Evaluates de Casteljau's algorithm at a given time.
         *
         * @param t Time in [0, 1]
         *
         * @returns
         *  Array of layers. Each layer depicts one pass of the algorithm.
         *  In a curve of complexity N, the first layer has N vertices and the last
         *  just 1. This vertex equals the return value from this.at(t)
         */
        shell: function (t) {

            if (this._out_of_time_bounds(t)) { return null; }
            if (this.complexity === 0) { return []; }

            var shell;
            var active_layer, new_layer;

            shell = [[]];
            active_layer = shell[0];

            this._points.forEach(function(p) {

                active_layer.push(Vector2.copy(p));
            });

            while (active_layer.length > 1) {

                new_layer = [];
                for (var i = 1; i < active_layer.length; ++i) {

                    new_layer[i - 1] = (

                        active_layer[i].mulS(t).add(

                            active_layer[i - 1].mulS(1 - t)
                        )
                    );
                }
                shell.push(new_layer);
                active_layer = new_layer;
            }

            return shell;
        },

        /**
         * Access control point at given index.
         *
         * @param index Integer in [0, complexity)
         * @returns {Vector2} Control point vector.
         */
        point: function(index) {

            return this._points[index];
        },

        /**
         * Gets the number of control points.
         *
         * @returns {Number}
         */
        get complexity() { return this._points.length; }
    };


    if (typeof exports !== 'undefined') {

        exports.Curve = Curve;
    }
    else if (typeof window !== 'undefined') {

        window.Bezier = {
            Curve: Curve,
            Vector2: Vector2
        };
    }
})();
