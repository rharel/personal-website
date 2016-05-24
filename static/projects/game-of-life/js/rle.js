/**
 * @author Raoul Harel
 * @license The MIT license (LICENSE.txt)
 * @copyright 2015 Raoul Harel
 * @url https://github.com/rharel/js-gol
 */


(function() {

    /**
     * Parses an RLE string into live cell coordinates list.
     *
     * @param data An RLE string.
     * @returns {{cells: Array, width: number, height: number}}
     */
    function parse_rle(data) {

        var result = {

            cells: [],
            width: 0,
            height: 1
        };

        var x = 0;
        var y = 0;
        var n = '';

        var i, j, char;
        for (i = 0; i < data.length; ++i) {

            char = data[i];

            if (char === '$') {  // end of line

                x = 0;
                n = n === '' ? 1 : parseInt(n);
                y += n;
                n = '';
            }

            else if (char === 'b') {  // dead cell

                n = n === '' ? 1 : parseInt(n);
                x += n;
                n = '';
            }

            else if (char === 'o') {  // live cell

                n = n === '' ? 1 : parseInt(n);

                if (x + n > result.width) { result.width = x + n; }

                for (j = 0; j < n; ++j) { result.cells.push({x: x++, y: y}); }
                n = '';
            }

            else if (!isNaN(parseInt(char))) {

                n += char;
            }
        }

        result.height = y + 1;
        return result;
    }

    if (typeof window.Gol === 'undefined') { window.Gol = {}; }
    window.Gol.parse_rle = parse_rle;
})();
