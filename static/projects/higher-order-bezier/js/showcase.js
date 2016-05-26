
(function() {

    function _arrange_square(cx, cy, radius) {

        return [

            {x: cx - radius, y: cy - radius},
            {x: cx + radius, y: cy - radius},
            {x: cx + radius, y: cy + radius},
            {x: cx - radius, y: cy + radius},
            {x: cx - radius, y: cy - radius}
        ];
    }
    function _arrange_star(cx, cy, ri, ro, phi, n) {

        var points = [];
        var i;
        var r = ri;
        var theta = phi, dtheta = 2 * Math.PI / n;

        for (i = 0; i <= n; ++i) {

            r = i % 2 == 0 ? ro : ri;

            points.push({

                x: cx + r * Math.cos(theta),
                y: cy + r * Math.sin(theta)
            });

            theta += dtheta;
        }

        return points;
    }
    function _arrange_zigzag(x0, y0, D, w0, w1, n) {

        var points = [];

        D = new Bezier.Vector2(D.x, D.y).mulS(1 / n);
        var N = new Bezier.Vector2(D.y, -D.x);
        N = N.mulS(1 / N.length);

        var P = new Bezier.Vector2(x0, y0);
        var w = w0;
        var dw = (w1 - w0) / n;

        var i;
        for (i = 0; i < n; ++i) {

            points.push({x: P.x, y: P.y});

            P = P.add(D);
            P = P.add(N.mulS(i % 2 == 0 ? w : -w));
            w += dw;
        }

        return points;
    }

    var artworks = [

        function(context) {

            var w = context.canvas.clientWidth;
            var h = context.canvas.clientHeight;
            var curve = new Bezier.Curve(_arrange_square(0.5 * w, 0.5 * h, 0.25 * w));
            var view = new Bezier.CanvasView(curve, context);

            view.background.visible = true;
            view.background.color = 'black';
            view.outline.visible = true;
            view.outline.color = '#53777A';
            view.outline.t = 1.0;
            view.shell.visible = true;
            view.shell.colors = ['#ECD078', '#D95B43', '#C02942', '#542437', '#53777A'];
            view.shell.t = 0.5;
            view.points.visible = true;
            view.points.color = '#53777A';
            view.render();
        },
        function(context) {

            var w = context.canvas.clientWidth;
            var h = context.canvas.clientHeight;
            var curve = new Bezier.Curve(_arrange_star(

                0.5 * w, 0.5 * h,
                0.01 * w, 0.45 * w,
                -0.04 * Math.PI, 25
            ));
            var view = new Bezier.CanvasView(curve, context);

            view.background.visible = true;
            view.background.color = '#341208';
            view.outline.visible = false;
            view.shell.visible = true;
            view.shell.size = 1;
            view.shell.colors = ['#FD9D06', '#EA1500', '#FFFF00'];
            view.shell.t = 0.05;
            view.points.visible = true;//false;
            view.points.color = 'red';
            view.points.radius = 5;
            view.render();
        },
        function(context) {

            var w = context.canvas.clientWidth;
            var h = context.canvas.clientHeight;
            var curve = new Bezier.Curve(_arrange_zigzag(

                0.2 * w, 0.05 * h,
                {x: 0, y: 0.95 * h},
                0.6 * w, 0.01 * w,
                25)
            );
            var view = new Bezier.CanvasView(curve, context);

            view.background.visible = true;
            view.background.color = '#0B013E';
            view.outline.visible = false;
            view.shell.visible = true;
            view.shell.colors = ['#7D00B7', '#EC34FE', 'white'];
            view.shell.size = 1;
            view.shell.t = 0.2;
            view.points.visible = true;
            view.points.color = '#7D00B7';
            view.points.radius = 3;
            view.render();
        }
    ];
    function _initialize() {


        var i, canvas, context;
        for (i = 0; i < 3; ++i) {

            canvas = document.getElementById('showcase-canvas-' + i);
            context = canvas.getContext('2d');
            artworks[i](context);
        }
    }

    window.addEventListener('load', _initialize);
})();
