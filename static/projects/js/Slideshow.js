// Operates image slideshows.
(function()
{
    class Slideshow
    {
        static from_element_id(id, urls)
        {
            const active_slide_index = document.getElementById(id + '-active-slide-index'),
                  slide_count        = document.getElementById(id + '-slide-count'),
                  image              = document.getElementById(id + '-image'),
                  show_previous      = document.getElementById(id + '-show-previous'),
                  show_next          = document.getElementById(id + '-show-next');

            const slideshow = new Slideshow(image, urls);

            function update_active_slide_index_display()
            {
                active_slide_index.textContent = slideshow.active_slide_index + 1;
            }
            show_previous.addEventListener('click', () =>
            {
                slideshow.previous();
                update_active_slide_index_display();
            });
            show_next.addEventListener('click', () =>
            {
                slideshow.next();
                update_active_slide_index_display();
            });

            slide_count.textContent = slideshow.slide_count;
            update_active_slide_index_display();
            slideshow.update_display();

            return {

                DOM: {
                    active_slide_index: active_slide_index,
                    slide_count: slide_count,
                    image: image,
                    show_previous: show_previous,
                    show_next: show_next
                },
                slideshow: slideshow
            };
        }

        constructor(image, urls)
        {
            this._image = image;
            this._urls  = urls;

            this._active_url_index = 0;
        }

        get slide_count()        { return this._urls.length;      }
        get active_slide_index() { return this._active_url_index; }

        update_display()
        {
            this._image.src = this._urls[this._active_url_index];
        }

        previous()
        {
            if (this._active_url_index - 1 >= 0)
            {
                this._active_url_index -= 1;
                this.update_display();

                return true;
            }
            else { return false; }
        }
        next()
        {
            if (this._active_url_index + 1 < this._urls.length)
            {
                this._active_url_index += 1;
                this.update_display();

                return true;
            }
            else { return false; }
        }
    }
    define({
        from_element_id: Slideshow.from_element_id
    });
})();
