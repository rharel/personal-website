(function()
{
    function initialize(prism)
    {
        prism.highlightAll();
    }

    require.config({
        shim: { '/static/3rd/prism/prism.min.js': { exports: 'Prism' } }
    });
    require(['/static/3rd/prism/prism.min.js'], function(prism)
    {
        if (document.readyState === "complete") { initialize(prism); }
        else
        {
            window.addEventListener('load', () => initialize(prism));
        }
    });
})();
