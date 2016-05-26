/**
 * Operates figure 1 in index.html
 *
 * @author Raoul Harel
 * @url www.rharel.com
 */


(function() {

    var clips = {

        'fig1-linear': {

            points: [
                {x: 0.2, y: 0.8},
                {x: 0.8, y: 0.2}
            ],
            canvas: null,
            curve: null,
            view: null,
            precision: 1,
            colors: ['#FFAAAA', 'black'],
            animation: new Bezier.Animation(20, 19, 0.05)
        },
        'fig1-quadratic': {

            points: [
                {x: 0.2, y: 0.8},
                {x: 0.5, y: 0.2},
                {x: 0.8, y: 0.8}
            ],
            canvas: null,
            curve: null,
            view: null,
            precision: 0.1,
            colors: ['#FFAAAA', '#50AA50', 'black'],
            animation: new Bezier.Animation(20, 49, 0.02)
        },
        'fig1-cubic': {

            points: [
                {x: 0.2, y: 0.8},
                {x: 0.4, y: 0.2},
                {x: 0.6, y: 0.8},
                {x: 0.8, y: 0.2}
            ],
            canvas: null,
            curve: null,
            view: null,
            precision: 0.1,
            colors: ['#FFAAAA', '#50AA50', '#8080FF', 'black'],
            animation: new Bezier.Animation(20, 99, 0.01)
        }
    };
    
    function _initialize() {

        var ids = ['fig1-linear', 'fig1-quadratic', 'fig1-cubic'];
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
                clip.view.outline.size = 2;
                clip.view.outline.precision = clip.precision;
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
