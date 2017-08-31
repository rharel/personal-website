/**
 * Operates figure 1.
 */


(function() {

    var canvas_id = 'fig1-random-point-diagram';
    var canvas = null;  // assigned through _initialize()
    var n_points = 8;
    var padding = 0.05;
    var color_brightness = 0.8;
    var sites = [];  // assigned through _refresh()
    var voronoi = null; // assigned through _initialize()

    function _mix(a, b) { return (a + b) / 2; }
    function _random_in_range(a, b) { return a + Math.random() * (b - a); }
    function _random_color(brightness) {

        return {

            r: _mix(Math.random(), brightness),
            g: _mix(Math.random(), brightness),
            b: _mix(Math.random(), brightness)
        };
    }

    function _generate_points(n) {

        var points = [];
        for (var i = 0; i < n_points; ++i) {

            points.push({

                x: _random_in_range(padding * canvas.width, (1 - padding) * canvas.width),
                y: _random_in_range(padding * canvas.height, (1 - padding) * canvas.height),
                color: _random_color(color_brightness)
            });
        }
        return points;
    }
    function _refresh() {

        sites.forEach(function(site) {

            voronoi.remove(site.id);
        });

        sites = [];
        _generate_points(n_points).forEach(function(p) {

            sites.push(voronoi.point(p.x, p.y, p.color));
        });

        voronoi.render();
    }
    function _initialize() {

        canvas = document.getElementById(canvas_id);
        voronoi = new Voronoi.Diagram({

            canvas: canvas,
            precision: 24,
            markers: true
        });
        _refresh();

        canvas.addEventListener('click', _refresh);
    }

    requirejs.config({
        paths: {
            "three": "/static/3rd/three/three.min",
            "voronoi": "/static/projects/voronoi-on-the-gpu/js/voronoi.min"
        }
    });
    define(["three", "voronoi"], () =>
    {
        if (document.readyState === "complete") { _initialize(); }
        else
        {
            window.addEventListener('load', () => _initialize());
        }
    });
})();
