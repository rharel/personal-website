/**
 * Operates figure 2 in index.html
 *
 * @author Raoul Harel
 * @url www.rharel.com
 */


(function() {
    
    var patterns = {
      
        'glider': {
            
            world: new Gol.World(8, 8, true),
            canvas: null,
            view: null,
            rle: 'bob$2bo$3o!',
            data: null,
            offset: {x: 1, y: 1},
            animation: new Gol.Animation(4, 12)
        },
        'lightweight-spaceship': {

            world: new Gol.World(13, 7, true),
            canvas: null,
            view: null,
            rle: 'bo2bo$o4b$o3bo$4o!',
            data: null,
            offset: {x: 7, y: 1},
            animation: new Gol.Animation(4, 12)
        },
        'heavyweight-spaceship': {

            world: new Gol.World(15, 9, false),
            canvas: null,
            view: null,
            rle: '3b2o2b$bo4bo$o6b$o5bo$6o!',
            data: null,
            offset: {x: 7, y: 1},
            animation: new Gol.Animation(4, 12)
        },

        'blinker': {

            world: new Gol.World(5, 5, false),
            canvas: null,
            view: null,
            rle: '3o!',
            data: null,
            offset: {x: 1, y: 2},
            animation: new Gol.Animation(2, 6)
        },
        'pulsar': {

            world: new Gol.World(17, 17, false),
            canvas: null,
            view: null,
            rle: '2b3o3b3o2b2$o4bobo4bo$o4bobo4bo$o4bobo4bo$2b3o3b3o2b2$2b3o3b3o2b$o4bob' +
                 'o4bo$o4bobo4bo$o4bobo4bo2$2b3o3b3o!',
            data: null,
            offset: {x: 2, y: 2},
            animation: new Gol.Animation(3, 9)
        },
        'queen-bee-shuttle': {

            world: new Gol.World(24, 9, false),
            canvas: null,
            view: null,
            rle: '9bo12b$7bobo12b$6bobo13b$2o3bo2bo11b2o$2o4bobo11b2o$7bobo12b$9bo!',
            data: null,
            offset: {x: 1, y: 1},
            animation: new Gol.Animation(30, 90)
        },

        'gosper-glider-gun': {

            world: new Gol.World(38, 22, false),
            canvas: null,
            view: null,
            rle: '24bo11b$22bobo11b$12b2o6b2o12b2o$11bo3bo4b2o12b2o$2o8bo5bo3b2o14b$2o8b' +
                 'o3bob2o4bobo11b$10bo5bo7bo11b$11bo3bo20b$12b2o!',
            data: null,
            offset: {x: 1, y: 1},
            animation: new Gol.Animation(20, 60)
        },

        'blinker-puffer-1': {

            world: new Gol.World(35, 22, false),
            canvas: null,
            view: null,
            rle: '3bo5b$bo3bo3b$o8b$o4bo3b$5o4b4$b2o6b$2ob3o3b$b4o4b$2b2o5b2$5b2o2b$3bo' +
                 '4bo$2bo6b$2bo5bo$2b6o!',
            data: null,
            offset: {x: 25, y: 1},
            animation: new Gol.Animation(16, 48)
        },

        'r-pentomino': {

            world: new Gol.World(128, 80, false),
            canvas: null,
            view: null,
            rle: 'b2o$2ob$bo!',
            data: null,
            offset: {x: 48, y: 40},
            animation: new Gol.Animation(30, 1150)
        }
    };

    function _initialize() {

        var view_style = {

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

        var elements = document.getElementsByClassName('fig3-animated-canvas');
        var i, element;
        var pattern;
        for (i = 0; i < elements.length; ++i) {

            element = elements[i];
            pattern = _get_pattern(element.id);

            if (pattern !== null) {

                pattern.canvas = element;
                pattern.view = new Gol.CanvasView(pattern.canvas, view_style);
                pattern.data = Gol.parse_rle(pattern.rle);
                //pattern.offset.x = Math.round(0.5 * (pattern.world.width - pattern.data.width));
                //pattern.offset.y = Math.round(0.5 * (pattern.world.height - pattern.data.height));

                _reset(pattern);
            }
        }
    }

    function _get_pattern(canvas_id) {

        var pattern_name = canvas_id.slice(5);
        if (patterns.hasOwnProperty(pattern_name)) {

            return patterns[pattern_name];
        }
        else {

            return null;
        }
    }

    function _reset(pattern) {

        pattern.world = new Gol.World(

            pattern.world.width, pattern.world.height,
            pattern.world.is_wrapped
        );
        pattern.data.cells.forEach(function(cell) {

            pattern.world.spawn(

                pattern.offset.x + cell.x,
                pattern.offset.y + cell.y
            );
        });
        pattern.view.render(pattern.world);
    }

    function toggle_animation(canvas_id) {

        var pattern = _get_pattern(canvas_id);
        if (pattern === null) { return; }

        var overlay = pattern.canvas.nextElementSibling;

        if (overlay.style.opacity !== '0') {  // start

            overlay.style.opacity = '0';
            pattern.animation.animate(

                pattern.world, pattern.view,
                function() { toggle_animation(canvas_id); }
            );
        }
        else {  // stop

            overlay.style.opacity = '1';
            pattern.animation.stop();
            _reset(pattern);
        }
    }

    window.Gol.toggle_animation = toggle_animation;
    window.addEventListener('load', _initialize);
})();
