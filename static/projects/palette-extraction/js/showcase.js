(function() {
    const EXTRACTION_COLOR_COUNT = 10;

    // Initializes the palette with transparent colors.
    function initialize_palette(host)
    {
        for (let i = 0; i < EXTRACTION_COLOR_COUNT; ++i)
        {
            const span = document.createElement('span');
            span.classList += 'color';
            span.style.backgroundColor = `rgba(0, 0, 0, 0)`;

            host.appendChild(span);
        }
    }
    // Adds colors contained in the given array as <span class="color"> to the host element.
    function display_palette(palette, host)
    {
        palette.forEach((color, index) =>
        {
            color = color.map(channel => Math.round(channel));
            host.childNodes[index]
                .style.backgroundColor = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
        });
    }
    function initialize(extract_palette)
    {
        const file_input = document.getElementById('showcase-image-file'),
              image      = document.getElementById('showcase-image'),
              palette    = document.getElementById('showcase-palette');

        initialize_palette(palette);

        const file_reader = new FileReader();

        image.addEventListener('load', () =>
        {
            const w = Math.ceil(image.naturalWidth  / 10),
                  h = Math.ceil(image.naturalHeight / 10);

            const s         = Math.min(w, h),
                  cell_size = { width: s, height: s };

            display_palette(
                extract_palette.from_image(image, EXTRACTION_COLOR_COUNT, cell_size),
                palette
            );
        });
        file_reader.addEventListener('load', event =>
        {
            image.src = event.target.result;
        });
        file_input.addEventListener('change', () =>
        {
            if (file_input.files.length > 0) { file_reader.readAsDataURL(file_input.files[0]); }
        });

        image.crossOrigin = true;
        image.src         = "https://i.imgur.com/eYtvdYlm.jpg";
    }

    requirejs.config({
        paths: {
            "palette_extraction": "/static/projects/palette-extraction/js/palette_extraction.min"
        }
    });
    define(["palette_extraction"], extract_palette =>
    {
        if (document.readyState === "complete") { initialize(extract_palette); }
        else
        {
            window.addEventListener('load', () => initialize(extract_palette));
        }
    });
})();
