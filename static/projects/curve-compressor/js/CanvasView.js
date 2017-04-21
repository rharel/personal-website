/**
 * @author Raoul Harel
 * @license The MIT license (LICENSE.txt)
 * @copyright 2017 Raoul Harel
 * @url https://github.com/rharel/ts-curve-compressor
 */


(function()
{
    function CanvasView(context)
    {
        this._context = context;
    }

    CanvasView.BACKGROUND_COLOR = 'white';

    CanvasView.prototype =
    {
        constructor: CanvasView,

        render_line_strip: function (vertices, width, color)
        {
            this._context.save();

            this._context.lineWidth = width;
            this._context.strokeStyle = color;

            this._context.beginPath();
            this._context.moveTo(vertices[0].x, vertices[0].y);
            vertices.forEach
            (   function(p)
                {
                    this._context.lineTo(p.x, p.y);
                }.bind(this)
            );
            this._context.stroke();
            this._context.closePath();

            this._context.restore();
        },
        render_vertices: function(vertices, radius, color)
        {
            this._context.save();

            this._context.fillStyle = color;

            vertices.forEach
            (   function(p)
                {
                    this._context.beginPath();
                    this._context.moveTo(p.x, p.y);
                    this._context.arc
                    (   p.x, p.y, radius,
                        0, 2 * Math.PI
                    );
                    this._context.fill();
                    this._context.closePath();

                }.bind(this)
            );

            this._context.restore();
        },
        render_background: function()
        {
            this._context.save();

            this._context.fillStyle = CanvasView.BACKGROUND_COLOR;
            this._context.fillRect
            (   0, 0,
                this._context.canvas.clientWidth,
                this._context.canvas.clientHeight
            );

            this._context.restore();
        },

        get context() { return this._context; }
    };

    if (typeof window !== 'undefined')
    {
        window.CurveCompressor.CanvasView = CanvasView;
    }
})();
