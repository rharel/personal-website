import { Color, hsl_from_rgb, rgb_from_hsl } from "./color_conversion";
import { k_means_clusters, Sample } from "./k_means_clustering";

function random_integer_in_range(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

export function palette_from_image_data(
  image_data: ImageData,
  sampling_cell_size: number,
  palette_size: number
): Color[] {
  // Collect color observations using jittered-grid super sampling.
  const samples_rgb: Color[] = [];
  for (
    let x_min = 0;
    x_min < image_data.width - sampling_cell_size;
    x_min += sampling_cell_size
  ) {
    for (
      let y_min = 0;
      y_min < image_data.height - sampling_cell_size;
      y_min += sampling_cell_size
    ) {
      const x = random_integer_in_range(x_min, x_min + sampling_cell_size);
      const y = random_integer_in_range(y_min, y_min + sampling_cell_size);
      const sample_index = 4 * (x + y * image_data.width);
      const sample_slice = image_data.data.slice(
        sample_index,
        sample_index + 3
      );
      samples_rgb.push([sample_slice[0], sample_slice[1], sample_slice[2]]);
    }
  }

  const samples_hsl: Color[] = samples_rgb.map((color) =>
    hsl_from_rgb(color[0], color[1], color[2])
  );

  const clusters_initial_guess: Color[] = [];
  for (let i = 0; i < palette_size; i += 1) {
    const random_index = random_integer_in_range(0, samples_hsl.length - 1);
    clusters_initial_guess.push(samples_hsl[random_index]);
  }

  function hsl_distance(a: Sample, b: Sample): number {
    return (
      (a[0] - b[0]) * (a[0] - b[0]) +
      (a[1] - b[1]) * (a[1] - b[1]) +
      (a[2] - b[2]) * (a[2] - b[2])
    );
  }

  return k_means_clusters(
    samples_hsl,
    palette_size,
    clusters_initial_guess,
    hsl_distance
  )
    .sort((a, b) => b.size - a.size)
    .map((cluster) =>
      rgb_from_hsl(cluster.mean[0], cluster.mean[1], cluster.mean[2])
    );
}

export function palette_from_image_element(
  image: HTMLImageElement,
  sampling_cell_size: number,
  palette_size: number
): Color[] {
  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;

  const context = canvas.getContext("2d");
  if (context === null) {
    throw new Error("cannot get canvas context");
  }

  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  const image_data = context.getImageData(0, 0, canvas.width, canvas.height);
  return palette_from_image_data(image_data, sampling_cell_size, palette_size);
}
