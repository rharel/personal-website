/**
 * @author Raoul Harel
 * @license The MIT license (LICENSE.txt)
 * @copyright 2015 Raoul Harel
 * @url https://github.com/rharel/js-bezier
 */


(function() {

    function CanvasView(curve, context) {

        this._curve = curve;

        this._context = context;

        this._background = {

            visible: true,
            color: 'white'
        };
        this._shell = {

            visible: false,
            t: 0,
            colors: ['black'],
            size: 5,
            _data: null
        };
        this._outline = {

            visible: true,
            t: 1,
            precision: 0.01,
            color: 'black',
            size: 5,
            _data: null
        };
        this._points = {

            visible: true,
            color: 'black',
            radius: 5
        };
    }
    CanvasView.prototype = {

        constructor: CanvasView,

        _compute: function() {

            this._shell._data = this._curve.shell(this._shell.t);
            this._outline._data = this._curve.outline(0, this._outline.t, this._outline.precision);
        },

        _render_line_strip: function(points, size, color) {

            this._context.save();

            this._context.lineWidth = size;
            this._context.strokeStyle = color;

            this._context.beginPath();
            this._context.moveTo(points[0].x, points[0].y);
            points.forEach(function(p) {

                this._context.lineTo(p.x, p.y);
            }.bind(this));
            this._context.stroke();
            this._context.closePath();

            this._context.restore();
        },
        _render_points: function(points, radius, color) {

            this._context.save();

            this._context.fillStyle = color;

            points.forEach(function(p) {

                this._context.beginPath();
                this._context.moveTo(p.x, p.y);
                this._context.arc(

                    p.x, p.y, radius,
                    0, 2 * Math.PI
                );
                this._context.fill();
                this._context.closePath();

            }.bind(this));

            this._context.restore();
        },
        _render_background: function() {

            this._context.save();

            this._context.fillStyle = this._background.color;
            this._context.fillRect(

                0, 0,
                this._context.canvas.clientWidth,
                this._context.canvas.clientHeight
            );

            this._context.restore();
        },

        render: function() {

            this._compute();

            if (this._background.visible) {

                this._render_background();
            }
            if (this._shell.visible) {

                var layers = this._shell._data;
                var i, layer_color;
                for (i = 0; i < layers.length; ++i) {

                    layer_color = this._shell.colors[i % this._shell.colors.length];
                    this._render_line_strip(

                        layers[i],
                        this._shell.size,
                        layer_color
                    );
                }
                for (i = 1; i < layers.length; ++i) {

                    layer_color = this._shell.colors[i % this._shell.colors.length];
                    if (this._points.visible) {

                        this._render_points(

                            layers[i],
                            this._points.radius,
                            layer_color
                        );
                    }
                }
            }
            if (this._outline.visible) {

                this._render_line_strip(

                    this._outline._data,
                    this._outline.size,
                    this._outline.color
                );
            }
            if (this._points.visible) {

                this._render_points(

                    this._shell._data[0],
                    this._points.radius,
                    this._points.color
                );
            }
        },

        get curve() { return this._curve; },
        set curve(value) { this._curve = value; },

        get context() { return this._context; },
        set context(value) { this._context = value; },

        get background() { return this._background; },
        get shell() { return this._shell; },
        get outline() { return this._outline; },
        get points() { return this._points; },

        set t(value) {

            this._outline.t = +value;
            this._shell.t = +value;
        }
    };

    if (typeof window !== 'undefined') {

        window.Bezier.CanvasView = CanvasView;
    }
})();
