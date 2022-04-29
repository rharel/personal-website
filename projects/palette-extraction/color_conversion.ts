export type Color = [number, number, number];

// Generates triplet [h, s, l] with members in [0, 1] from triplet r, g, b with members
// in [0, 255].
//
// Adapted from https://gist.github.com/mjackson/5311256
export function hsl_from_rgb(r: number, g: number, b: number): Color {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);

  let h = 0;
  let s = 0;
  let l = (max + min) / 2;

  if (max === min) {
    h = 0;
    s = 0;
  } // achromatic
  else {
    const span = max - min;
    s = l > 0.5 ? span / (2 - max - min) : span / (max + min);
    switch (max) {
      case r:
        h = (g - b) / span + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / span + 2;
        break;
      case b:
        h = (r - g) / span + 4;
        break;
    }
    h /= 6;
  }
  return [h, s, l];
}

// Generates triplet [r, g, b] with members in [0, 255] from triplet h, s, l with members
// in [0, 1].
//
// Adapted from https://gist.github.com/mjackson/5311256
export function rgb_from_hsl(h: number, s: number, l: number): Color {
  function rgb_from_hue(p: number, q: number, t: number) {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  }

  let r = 0;
  let g = 0;
  let b = 0;

  if (s === 0) {
    r = l;
    g = l;
    b = l;
  } // achromatic
  else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = rgb_from_hue(p, q, h + 1 / 3);
    g = rgb_from_hue(p, q, h);
    b = rgb_from_hue(p, q, h - 1 / 3);
  }
  return [
    Math.max(Math.min(r * 256, 255), 0),
    Math.max(Math.min(g * 256, 255), 0),
    Math.max(Math.min(b * 256, 255), 0),
  ];
}
