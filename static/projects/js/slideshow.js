/**
 * Operates image slideshows.
 */


(function() {

    var slideshows = {};

    function register(id, paths) {

        slideshows[id] = {

            id: id,
            element_img: null,
            element_index: null,
            element_total: null,
            paths: paths.split(';'),
            index: 0
        };
    }
    function previous(id) {

        var slideshow = slideshows[id];
        slideshow.index = Math.max(slideshow.index - 1, 0);
        slideshow.element_img.src = slideshow.paths[slideshow.index];
        slideshow.element_index.innerHTML = slideshow.index + 1;
    }
    function next(id) {

        var slideshow = slideshows[id];
        slideshow.index = Math.min(slideshow.index + 1, slideshow.paths.length - 1);
        slideshow.element_img.src = slideshow.paths[slideshow.index];
        slideshow.element_index.innerHTML = slideshow.index + 1;
    }

    function _initialize() {

        var id, slideshow;
        for (id in slideshows) {

            if (!slideshows.hasOwnProperty(id)) { continue; }

            slideshow = slideshows[id];
            slideshow.element_img = document.getElementById(id);
            slideshow.element_index = document.getElementById(id + '-index');
            slideshow.element_total = document.getElementById(id + '-total');

            slideshow.element_img.src = slideshow.paths[slideshow.index];
            slideshow.element_index.innerHTML = slideshow.index + 1;
            slideshow.element_total.innerHTML = slideshow.paths.length;
        }
    }

    window.Slideshow = {};
    window.Slideshow.register = register;
    window.Slideshow.previous = previous;
    window.Slideshow.next = next;
    window.addEventListener('load', _initialize);
})();
