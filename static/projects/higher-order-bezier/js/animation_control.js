/**
 * Controls animation clip start/stop.
 */


(function() {

    var clips = {};

    function register_animation(id, options) {

        clips[id] = options;
    }
    function reset_view(view) {

        view.t = 1;
        view.shell.visible = false;
        view.render();
    }
    function toggle_animation(id) {

        var clip = clips[id];
        if (clip === null) { return; }

        var overlay = clip.canvas.nextElementSibling;

        if (overlay.style.opacity !== '0') {  // start

            overlay.style.opacity = '0';
            clip.view.t = 0;
            clip.view.shell.visible = true;
            clip.animation.animate(

                clip.view,
                function() { toggle_animation(id); }
            );
        }
        else {  // stop

            overlay.style.opacity = '1';
            clip.animation.stop();
            reset_view(clip.view);
        }
    }

    window.Bezier.register_animation = register_animation;
    window.Bezier.reset_view = reset_view;
    window.Bezier.toggle_animation = toggle_animation;
})();
