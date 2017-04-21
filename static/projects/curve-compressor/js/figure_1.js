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
        {x: 0.2, y: 0.8},
        {x: 0.5, y: 0.0},
        {x: 0.8, y: 0.8}
    ];

    var ROUGH_PRECISION = 0.1;
    var SMOOTH_PRECISION = 0.01;

    var LINE_WIDTH = 10;
    var VERTEX_RADIUS = 4;

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

    function _prepare_drawing(canvas)
    {
        var result =
        {
            control_points: null,
            curve: null,
            rough_outline: null,
            smooth_outline: null,
            view: null
        };

        result.control_points = _to_canvas_coordinates
        (   CONTROL_POINTS,
            canvas.width, canvas.height
        );
        result.curve = new Bezier.Curve(result.control_points);
        result.rough_outline = result.curve.outline(0, 1, ROUGH_PRECISION);
        result.smooth_outline = result.curve.outline(0, 1, SMOOTH_PRECISION);
        result.view = new CurveCompressor.CanvasView(canvas.getContext('2d'));

        return result;
    }

    function _initialize()
    {
        var figure_a = document.getElementById('figure-1-a');
        var figure_b = document.getElementById('figure-1-b');

        var drawing_a = _prepare_drawing(figure_a);
        var drawing_b = _prepare_drawing(figure_b);

        drawing_a.view.render_background();
        drawing_a.view.render_line_strip(drawing_a.smooth_outline, LINE_WIDTH, 'black');

        drawing_b.view.render_background();
        drawing_b.view.render_line_strip(drawing_b.smooth_outline, LINE_WIDTH, 'black');
        drawing_b.view.render_vertices(drawing_b.rough_outline, VERTEX_RADIUS, 'skyblue');
    }
    window.addEventListener('load', _initialize);
})();
