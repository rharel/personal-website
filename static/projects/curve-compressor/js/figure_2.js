/**
 * Operates figure 1 in index.html
 *
 * @author Raoul Harel
 * @url www.rharel.com
 */


(function()
{
    var CONTROL_POINTS =
    [
        {x:  0.1, y:  0.2},
        {x:  0.2, y:  1.2},
        {x:  0.3, y: -0.3},
        {x:  0.4, y: -0.3},
        {x:  0.5, y:  0.2},
        {x:  0.6, y:  0.8},
        {x:  0.7, y:  1.5},
        {x:  0.8, y:  0.2}
    ];
    var CURVE = new Bezier.Curve(CONTROL_POINTS);
    var ORIGINAL_RESOLUTION = 1000;
    var ORIGINAL_OUTLINE = CURVE.outline
    (   0.0,  // t0
        1.0,  // t1
        1.0 / ORIGINAL_RESOLUTION  // dt
    );

    var LINE_WIDTH = 10;
    var VERTEX_RADIUS = 4;

    var COMPRESSION_FIGURES =
    {
        'b': 0.001,
        'c': 0.002,
        'd': 0.005,
        'e': 0.01,
        'f': 0.05,
        'g': 0.5
    };

    function _vertex_to_canvas_coordinates(vertex, width, height)
    {
        return {
            x: vertex.x * width,
            y: vertex.y * height
        };
    }
    function _to_canvas_coordinates(vertices, width, height)
    {
        return vertices.map
        (   function(vertex)
            {
                return _vertex_to_canvas_coordinates(vertex, width, height);
            }
        );
    }

    function _initialize()
    {
        var figure, view;

        figure = document.getElementById('figure-2-a');

        var vertices = _to_canvas_coordinates
        (   ORIGINAL_OUTLINE,
            figure.width, figure.height
        );

        view = new CurveCompressor.CanvasView(figure.getContext('2d'));
        view.render_background();
        view.render_line_strip(vertices, LINE_WIDTH, 'black');

        for (var property in COMPRESSION_FIGURES)
        {
            if (COMPRESSION_FIGURES.hasOwnProperty(property))
            {
                var label = property;
                var theta = COMPRESSION_FIGURES[label];

                figure = document.getElementById('figure-2-' + label);

                var compressed_vertices = _to_canvas_coordinates
                (   CurveCompressor.compress_strip(ORIGINAL_OUTLINE, theta),
                    figure.width, figure.height
                );

                view = new CurveCompressor.CanvasView(figure.getContext('2d'));
                view.render_background();
                view.render_line_strip(compressed_vertices, LINE_WIDTH, 'black');
                view.render_vertices(compressed_vertices, VERTEX_RADIUS, 'skyblue');

                var theta_label = document.getElementById
                (   'figure-2-' + label + '-theta'
                );
                theta_label.innerHTML = theta.toFixed(3);

                var compression_rate_label = document.getElementById
                (   'figure-2-' + label + '-compression-rate'
                );
                var compression_rate =
                    1.0 - (compressed_vertices.length / ORIGINAL_RESOLUTION);
                compression_rate_label.innerHTML =
                    compression_rate.toFixed(2) * 100;
            }
        }
    }
    window.addEventListener('load', _initialize);
})();
