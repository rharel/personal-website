import { palette_from_image_element } from "./image_palette_extraction";

function on_selected_image_change(file_input: HTMLInputElement) {
  if (file_input.files === null || file_input.files.length !== 1) {
    return;
  }
  const file = file_input.files.item(0);
  if (file === null) {
    return;
  }
  const image = new Image();
  image.src = URL.createObjectURL(file);
  image.addEventListener("load", () => {
    const color_elements = document.querySelectorAll<HTMLElement>(
      ".demo-palette-color"
    );
    const palette_size = color_elements.length;
    const sampling_cell_size = Math.ceil(
      Math.min(image.naturalWidth, image.naturalHeight) / 20
    );
    const palette = palette_from_image_element(
      image,
      sampling_cell_size,
      palette_size
    ).map((color) => color.map(Math.round));
    for (let i = 0; i < color_elements.length; i += 1) {
      color_elements.item(i).style.removeProperty("background-color");
    }
    for (let i = 0; i < palette.length; i += 1) {
      const color = palette[i];
      const element = color_elements.item(i);
      element.style.backgroundColor = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
      element.setAttribute(
        "aria-label",
        `Colored square: rgb(${color[0]}, ${color[1]}, ${color[2]})`
      );
    }
  });
}

function setup() {
  const file_input = document.getElementById("demo-image");
  if (!(file_input instanceof HTMLInputElement)) {
    return;
  }
  file_input.addEventListener("change", () =>
    on_selected_image_change(file_input)
  );
  document
    .getElementById("demo-select-image-button")
    ?.addEventListener("click", () => file_input.click());
}

window.addEventListener("DOMContentLoaded", setup);
