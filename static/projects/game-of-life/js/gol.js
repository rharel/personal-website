/**
 * @author Raoul Harel
 * @license The MIT license (LICENSE.txt)
 * @copyright 2015 Raoul Harel
 * @url https://github.com/rharel/js-gol
 */


(function() {

    function HashSet(hash) {

        this._hash = hash || HashSet.HASH_IDENTITY;
        this._items = {};
    }
    HashSet.HASH_IDENTITY = function(item) { return item; };
    HashSet.prototype = {

        constructor: HashSet,

        contains: function(item) {

            return this._items.hasOwnProperty(this._hash(item));
        },

        add: function(item) {

            this._items[this._hash(item)] = item;
        },

        remove: function(item) {

            delete this._items[this._hash(item)];
        },

        clear: function() {

            this._items = {};
        },

        enumerate: function(callback) {

            var key, item;
            for (key in this._items) {

                if (this._items.hasOwnProperty(key)) {

                    item = this._items[key];
                    if (callback(item)) { return; }
                }
            }
        }
    };

    function HashMap(hash) {

        this._hash = hash || function(item) { return item; };
        this._kv = {};  // key-value pairs
    }
    HashMap.prototype = {

        constructor: HashMap,

        contains: function(key) {

            return this._kv.hasOwnProperty(this._hash(key));
        },

        get: function(key) {

            return this._kv[this._hash(key)];
        },

        set: function(key, value) {

            this._kv[this._hash(key)] = value;
        },

        remove: function(key) {

            delete this._kv[this._hash(key)];
        },

        clear: function() {

            this._kv = {};
        },

        enumerate: function(callback) {

            var key, value;
            for (key in this._kv) {

                if (this._kv.hasOwnProperty(key)) {

                    value = this._kv[key];
                    if (callback(value)) { return; }
                }
            }
        }
    };

    function hash_point(p) {

        return Math.round(p.x) + ',' + Math.round(p.y);
    }

    /**
     * Create a new simulation.
     *
     * @param width
     * @param height
     * @param is_wrapped
     *
     * @constructor
     */
    function World(width, height, is_wrapped) {

        this._width = width;
        this._height = height;
        this._is_wrapped = typeof is_wrapped !== 'undefined' ? is_wrapped : false;

        this._live_cells = new HashSet(hash_point);
        this._neighbour_count = new HashMap(hash_point);
        this._dirty = new HashSet(hash_point);

        this._population = 0;
    }
    World.prototype = {

        constructor: World,

        is_out_of_bounds: function(x, y) {

            return x < 0 || x >= this._width ||
                   y < 0 || y >= this._height;
        },

        /**
         * Increment the neighbours-counter for a cell.
         *
         * @param x
         * @param y
         *
         * @private
         */
        _add_neighbour: function(x, y) {

            if (!this._is_wrapped && this.is_out_of_bounds(x, y)) { return; }

            x = x === this._width ? 0 :
                x === -1 ? this._width - 1 :
                x;
            y = y === this._height ? 0 :
                y === -1 ? this._height - 1 :
                y;
            var p = {x: x, y: y};

            if (!this._neighbour_count.contains(p)) {

                this._neighbour_count.set(p, 0);
            }
            this._neighbour_count.set(

                p, this._neighbour_count.get(p) + 1
            );

            this._dirty.add(p);
        },

        /**
         * Decrement the neighbours-counter for a cell.
         *
         * @param x
         * @param y
         *
         * @private
         */
        _remove_neighbour: function(x, y) {

            if (!this._is_wrapped && this.is_out_of_bounds(x, y)) { return; }

            x = x === this._width ? 0 :
                x === -1 ? this._width - 1 :
                x;
            y = y === this._height ? 0 :
                y === -1 ? this._height - 1 :
                y;
            var p = {x: x, y: y};

            if (this._neighbour_count.contains(p)) {

                this._neighbour_count.set(

                    p, this._neighbour_count.get(p) - 1
                );
            }
            if (this._neighbour_count.get(p) <= 0) {

                this._neighbour_count.remove(p);
            }

            this._dirty.add(p);
        },

        /**
         * Spawn a new living cell at given position.
         *
         * @param x
         * @param y
         *
         * @returns {boolean}
         *    True if the cell was spawned successfully.
         *    An unsuccessful spawn happens when the given position is out of world bounds, or
         *    when it already contains a living cell.
         */
        spawn: function(x, y) {

            if (this.is_out_of_bounds(x, y) || this.inspect(x, y)) { return false; }

            var p = {x: x, y: y};

            this._live_cells.add(p);
            ++ this._population;

            this._add_neighbour(x - 1, y - 1);
            this._add_neighbour(x - 1, y);
            this._add_neighbour(x - 1, y + 1);
            this._add_neighbour(x, y - 1);
            this._add_neighbour(x, y + 1);
            this._add_neighbour(x + 1, y - 1);
            this._add_neighbour(x + 1, y);
            this._add_neighbour(x + 1, y + 1);

            this._dirty.add(p);

            return true;
        },

        /**
         * Kill a cell at given position.
         *
         * @param x
         * @param y
         *
         * @returns {boolean}
         *    True if the cell was killed successfully.
         *    An unsuccessful kill happens when the given position is out of world bounds, or
         *    when it already contains a dead cell.
         */
        kill: function(x, y) {

            if (this.is_out_of_bounds(x, y) || !this.inspect(x, y)) { return false; }

            var p = {x: x, y: y};
            this._live_cells.remove(p);

            -- this._population;

            this._remove_neighbour(x - 1, y - 1);
            this._remove_neighbour(x - 1, y);
            this._remove_neighbour(x - 1, y + 1);
            this._remove_neighbour(x, y - 1);
            this._remove_neighbour(x, y + 1);
            this._remove_neighbour(x + 1, y - 1);
            this._remove_neighbour(x + 1, y);
            this._remove_neighbour(x + 1, y + 1);

            this._dirty.add(p);

            return true;
        },

        /**
         * Steps a single cell.
         *
         * @param x
         * @param y
         *
         * @returns {boolean} The new state of the cell.
         *
         * @private
         */
        _step_single: function(x, y) {

            var p = {x: x, y: y};

            var current_state = this.inspect(x, y);
            var n_neighbours = +current_state;

            if (this._neighbour_count.contains(p)) {

                n_neighbours += this._neighbour_count.get(p);
            }

            if (n_neighbours === 3) { return true; }
            else if (n_neighbours === 4) { return current_state; }
            else { return false; }
        },

        /**
         * Advance the simulation one generation into the future.
         *
         * @details
         *    All cells marked as dirty are evolved individually. In the process,
         *    new cells will be marked as dirty for the benefit of the next time step()
         *    is called.
         */
        step: function() {

            var spawned = [], died = [];
            var is_alive, was_alive;

            this._dirty.enumerate((function(p) {

                was_alive = this.inspect(p.x, p.y);
                is_alive = this._step_single(p.x, p.y);

                if (is_alive && !was_alive) {

                    spawned.push(p);
                }
                else if (!is_alive && was_alive) {

                    died.push(p);
                }
            }).bind(this));
            this._dirty.clear();

            spawned.forEach((function(p) {

                this.spawn(p.x, p.y);
            }).bind(this));

            died.forEach((function(p) {

                this.kill(p.x, p.y);
            }).bind(this));
        },

        /**
         * Get the state of a cell (alive or dead).
         *
         * @param x
         * @param y
         *
         * @returns {boolean} True if alive.
         */
        inspect: function(x, y) {

            return this._live_cells.contains({x: x, y: y});
        },

        /**
         * Traverses all living cells.
         *
         * @param callback
         *    A method taking two parameters (x, y).
         *
         * @details
         *    The given callback is called for each living cell in the simulation.
         *    The callback's return value should be a boolean indicating whether to abort iteration.
         *    So if the callback returns true, traversal stops.
         */
        inspect_all: function(callback) {

            this._live_cells.enumerate(callback);
        },

        get width() { return this._width; },
        get height() { return this._height; },

        get is_wrapped() { return this._is_wrapped; },
        set is_wrapped(value) { this._is_wrapped = !!value; },

        /**
         * Get the number of live cells.
         *
         * @returns {number}
         */
        get population() { return this._population; }
    };


    if (typeof exports !== 'undefined') {

        exports.World = World;
    }
    else if (typeof window !== 'undefined') {

        window.Gol = {
            World: World
        };
    }
})();
