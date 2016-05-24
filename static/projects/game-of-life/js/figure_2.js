/**
 * Operates figure 2 in index.html
 *
 * @author Raoul Harel
 * @url www.rharel.com
 */


(function () {

    var world_current, world_next;
    var canvas_current, canvas_next;
    var view_current, view_next;

    function _initialize() {

        canvas_current = document.getElementById('fig2-canvas-current');
        canvas_next = document.getElementById('fig2-canvas-next');

        world_current = new Gol.World(5, 5);
        world_current.spawn(2, 1);
        world_current.spawn(2, 2);
        world_current.spawn(2, 3);

        var current_view_style = {

            background: 'white',
            border: {
                stroke: 'black',
                stroke_width: 0
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
        var next_view_style = {

            background: 'white',
            border: {
                stroke: 'black',
                stroke_width: 0
            },
            grid: {
                stroke: 'lightgrey',
                stroke_width: 1
            },
            cell: {
                dead: 'white',
                live: 'darkgrey'
            }
        };

        view_current = new Gol.CanvasView(canvas_current, current_view_style);
        view_next = new Gol.CanvasView(canvas_next, next_view_style);

        canvas_current.addEventListener('click', _on_canvas_current_click);

        refresh();
    }

    function refresh() {

        _compute_world_next();

        view_current.render(world_current);
        view_next.render(world_next);
    }

    function _copy_world(source) {

        var result = new Gol.World(source.width, source.height);
        source.inspect_all(function(p) {

            result.spawn(p.x, p.y);
        });

        return result;
    }

    function _compute_world_next() {

        world_next = _copy_world(world_current);
        world_next.step();
    }

    function _on_canvas_current_click(event) {

        var bounds = canvas_current.getBoundingClientRect();
        var x = event.clientX - bounds.left;
        var y = event.clientY - bounds.top;

        var cell = view_current.to_cell_coordinates(x, y);
        if (!world_current.is_out_of_bounds(cell.x, cell.y)) {

            if (world_current.inspect(cell.x, cell.y)) {

                world_current.kill(cell.x, cell.y);
            }
            else {

                world_current.spawn(cell.x, cell.y);
            }

            refresh();
        }
    }

    window.addEventListener('load', _initialize);
})();
