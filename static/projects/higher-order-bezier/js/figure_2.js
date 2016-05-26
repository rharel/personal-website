/**
 * Operates figure 1 in index.html
 *
 * @author Raoul Harel
 * @url www.rharel.com
 */


(function() {

    function on_circle(cx, cy, radius, theta) {

        return {

            x: cx + radius * Math.cos(theta),
            y: cy + radius * Math.sin(theta)
        };
    }
    function twister(cx, cy, radius, degree) {

        var points = [];

        var theta = 0, theta_offset = 2 * Math.PI / degree;
        for (var i = 0; i < degree; ++i) {

            points.push(on_circle(cx, cy, radius, theta));
            theta += Math.PI + theta_offset;
        }
        points.push(on_circle(cx, cy, radius, 0));
        return points;
    }

    function _initialize() {

        var clips = {

            'fig2-twister-high': {

                points: twister(0.5, 0.5, 0.25, 12),
                canvas: null,
                curve: null,
                view: null,
                precision: 1,
                colors: ['red', 'green', 'blue'],
                animation: new Bezier.Animation(20, 499, 0.005)
            }
        };

        var ids = ['fig2-twister-high'];
        var elements = ids.map(function(id) {

            return document.getElementById(id);
        });
        var i, element, clip;
        for (i = 0; i < elements.length; ++i) {

            element = elements[i];
            clip = clips[element.id];

            if (clip !== null) {

                clip.canvas = element;
                clip.curve = new Bezier.Curve(clip.points.map(function(p) {

                    return {
                        x: p.x * clip.canvas.width,
                        y: p.y * clip.canvas.height
                    }
                }));
                clip.view = new Bezier.CanvasView(clip.curve, clip.canvas.getContext('2d'));
                clip.view.outline.visible = false;
                clip.view.points.radius = 4;
                clip.view.shell.colors = clip.colors;
                clip.view.shell.size = 1;
                Bezier.register_animation(element.id, clip);
                Bezier.reset_view(clip.view);
            }
        }
    }

    window.addEventListener('load', _initialize);
})();
