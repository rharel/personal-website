(function()
{
    function initialize(slideshow)
    {
        const image_directory = '/static/projects/k-means-clustering/img/';
        const urls = new Array(8)
            .fill("")
            .map((_, index) => image_directory + `demo_small${index + 1}.png`);

        slideshow.from_element_id('k-means-demo', urls);
    }
    define(["/static/projects/js/Slideshow.js"], slideshow =>
    {
        if (document.readyState === "complete") { initialize(slideshow); }
        else
        {
            window.addEventListener('load', () => initialize(slideshow));
        }
    });
})();
