/**
 * Gol.World view for HTML5 <canvas>
 *
 * @author Raoul Harel
 * @url www.rharel.com
 */


(function() {

    /**
     * Interface for rendering a Gol.World through <canvas>.
     *
     * @param canvas Target <canvas>.
     * @param style An object:
     *                  {
     *                    background: {CSS-color-string},
     *                    border: {
     *                      stroke: {CSS-color-string},
     *                      stroke_width: {float}
     *                    },
     *                    grid: {
     *                      stroke: {CSS-color-string},
     *                      stroke_width: {float}
     *                    },
     *                    cell: {
     *                      dead: {CSS-color-string},
     *                      live: {CSS-color-string}
     *                    }
     *                  }
     *              Describes how to style different elements of the view.
     *
     * @constructor
     */
    function CanvasView(canvas, style) {

        this._canvas = canvas;
        this._context = canvas.getContext('2d');

        var default_style = {

            background: 'white',
            border: {
                stroke: 'black',
                stroke_width: 1
            },
            grid: {
                stroke: 'lightgrey',
                stroke_width: 1
            },
            cell: {
                dead: 'white',
                live: 'black'
            }
        };
        this._style = style || default_style;

        this._world = null;
        this._cell_size = 0;
        this._viewport = {

            x: 0, y: 0,
            width: 0, height: 0
        };
    }

    CanvasView.prototype = {

        constructor: CanvasView,
        
        render: function(world) {

            if (typeof this._context === 'undefined') { return; }

            this._world = world;
            this._compute_viewport();

            this._draw_background();
            this._draw_cells();
            this._draw_grid();
            this._draw_border();
        },

        _compute_scale: function() {

            var scale_x = this._canvas.width / this._world.width;
            var scale_y = this._canvas.height / this._world.height;
        
            this._cell_size = Math.min(scale_x, scale_y);
        },
        _compute_viewport: function() {

            this._compute_scale();

            this._viewport.width = this._world.width * this._cell_size;
            this._viewport.height = this._world.height * this._cell_size;

            this._viewport.x = 0.5 * (this._canvas.width - this._viewport.width);
            this._viewport.y = 0.5 * (this._canvas.height - this._viewport.height);
        },

        _draw_background: function() {

            this._context.save();

            this._context.fillStyle = this._style.background;
            this._context.fillRect(0, 0, this._canvas.width, this._canvas.height);

            this._context.restore();
        },
        _draw_cells: function() {

            this._context.save();

            // Dead:
            this._context.fillStyle = this._style.cell.dead;
            this._context.fillRect(

                this._viewport.x, this._viewport.y,
                this._viewport.width, this._viewport.height
            );

            // Live:
            this._context.fillStyle = this._style.cell.live;
            this._context.translate(0.5, 0.5);

            var x, y;
            this._world.inspect_all((function(p) {

                x = this._viewport.x + p.x * this._cell_size;
                y = this._viewport.y + p.y * this._cell_size;

                this._context.beginPath();
                this._context.rect(x, y, this._cell_size, this._cell_size);
                this._context.fill();
            }).bind(this));

            this._context.restore();
        },
        _draw_grid: function() {

            if (this._style.grid.stroke_width <= 0) { return; }

            var x_start = this._viewport.x;
            var x_end = x_start + this._viewport.width;
            var y_start = this._viewport.y;
            var y_end = y_start + this._viewport.height;

            var x, y;
            var i, j;

            this._context.save();

            this._context.strokeStyle = this._style.grid.stroke;
            this._context.lineWidth = this._style.grid.stroke_width;
            this._context.translate(0.5, 0.5);

            this._context.beginPath();

            for (i = 0; i <= this._world.width; ++i) {
        
              x = this._viewport.x + i * this._cell_size;
        
              this._context.moveTo(x, y_start);
              this._context.lineTo(x, y_end);
            }
            for (j = 0; j <= this._world.height; ++j) {
        
              y = this._viewport.y + j * this._cell_size;

              this._context.moveTo(x_start, y);
              this._context.lineTo(x_end, y);
            }

            this._context.stroke();

            this._context.restore();
        },
        _draw_border: function() {

            if (this._style.border.stroke_width <= 0) { return; }

            this._context.save();

            this._context.strokeStyle = this._style.border.stroke;
            this._context.lineWidth = this._style.border.stroke_width;
            this._context.translate(0.5, 0.5);

            this._context.beginPath();
            this._context.rect(

              this._viewport.x, this._viewport.y,
              this._viewport.width, this._viewport.height
            );
            this._context.stroke();

            this._context.restore();
        },

        to_cell_coordinates: function(x, y) {

            return {
                x: Math.floor((x - this._viewport.x) / this._cell_size),
                y: Math.floor((y - this._viewport.y) / this._cell_size)
            };
        }
    };

    if (!window.Gol) { window.Gol = {}; }
    window.Gol.CanvasView = CanvasView;
})();
