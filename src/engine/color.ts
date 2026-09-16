import type { ColorInfo } from "./types";

const mod = (n: number, m: number) => ((n % m) + m) % m;

// Parse a color string in the format of #RRGGBB or #RGB
// and return an object with r, g, b values in the range of 0-255. Return null if the input is invalid.
function parseColor(input: string): { r: number; g: number; b: number } | null {
  const value = input.trim().toLowerCase();
  if (!value.startsWith("#")) return null;
  const h = value.slice(1);
  const full =
    h.length === 3
      ? h
          .split("")
          .map((x) => x + x)
          .join("")
      : h;
  if (!/^[0-9a-f]{6}$/.test(full)) return null;
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  };
}

// Convert linear RGB [0,1] to HSV. Hue is null for achromatic colors (s == 0).
function rgbToHsv(r: number, g: number, b: number) {
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b),
    d = max - min;
  let h: number | null = null;
  if (d) {
    h =
      max === r
        ? 60 * mod((g - b) / d, 6)
        : max === g
          ? 60 * ((b - r) / d + 2)
          : 60 * ((r - g) / d + 4);
  }
  return { h, s: max ? d / max : 0, v: max };
}

// Convert linear RGB [0,1] to HSL. Hue is null for achromatic colors (s == 0).
function rgbToHsl(r: number, g: number, b: number) {
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b),
    d = max - min,
    l = (max + min) / 2;
  let h: number | null = null;
  if (d) {
    h =
      max === r
        ? 60 * mod((g - b) / d, 6)
        : max === g
          ? 60 * ((b - r) / d + 2)
          : 60 * ((r - g) / d + 4);
  }
  return { h, s: d ? d / (1 - Math.abs(2 * l - 1)) : 0, l };
}

// Convert a gamma-encoded sRGB channel [0,1] to linear light (IEC 61966-2-1).
function linear(v: number) {
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
}

// Convert CIE XYZ (D65) to CIE Lab. White point: D65 (0.95047, 1.0, 1.08883).
function labFromXyz(x: number, y: number, z: number) {
  const f = (v: number) =>
    v > 216 / 24389 ? Math.cbrt(v) : (841 / 108) * v + 4 / 29;
  const fx = f(x / 0.95047),
    fy = f(y),
    fz = f(z / 1.08883);
  return { l: 116 * fy - 16, a: 500 * (fx - fy), b: 200 * (fy - fz) };
}

// Convert 8-bit RGB to Lab, OKLab, OKLch, and WCAG relative luminance.
// Uses standard sRGB→XYZ matrix for Lab, and the Björn Ottosson LMS matrix for OKLab.
function convert(r8: number, g8: number, b8: number) {
  const r = linear(r8 / 255),
    g = linear(g8 / 255),
    b = linear(b8 / 255);
  const x = r * 0.4124564 + g * 0.3575761 + b * 0.1804375,
    y = r * 0.2126729 + g * 0.7151522 + b * 0.072175,
    z = r * 0.0193339 + g * 0.119192 + b * 0.9503041;
  const lab = labFromXyz(x, y, z);
  const l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b,
    m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b,
    s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;
  const l3 = Math.cbrt(l),
    m3 = Math.cbrt(m),
    s3 = Math.cbrt(s);
  const oklab = {
    l: 0.2104542553 * l3 + 0.793617785 * m3 - 0.0040720468 * s3,
    a: 1.9779984951 * l3 - 2.428592205 * m3 + 0.4505937099 * s3,
    b: 0.0259040371 * l3 + 0.7827717662 * m3 - 0.808675766 * s3,
  };
  return {
    lab,
    oklab,
    oklch: {
      l: oklab.l,
      c: Math.hypot(oklab.a, oklab.b),
      // Hue is null when chroma is near zero (achromatic).
      h:
        Math.hypot(oklab.a, oklab.b) < 1e-7
          ? null
          : mod((Math.atan2(oklab.b, oklab.a) * 180) / Math.PI, 360),
    },
    luminance: 0.2126 * r + 0.7152 * g + 0.0722 * b,
  };
}

// Parse a hex color and compute all color space representations.
export function normalizeColor(input: string, index: number): ColorInfo | null {
  const rgb = parseColor(input);
  if (!rgb) return null;
  const r = rgb.r / 255,
    g = rgb.g / 255,
    b = rgb.b / 255;
  const hsl = rgbToHsl(r, g, b),
    hsv = rgbToHsv(r, g, b),
    spaces = convert(rgb.r, rgb.g, rgb.b);
  // Warm-to-cool score: cosine of (hue − 45°) weighted by saturation.
  const temperature =
    hsv.h == null ? 0 : Math.cos(((hsv.h - 45) * Math.PI) / 180) * hsv.s;
  const hex = `#${[rgb.r, rgb.g, rgb.b]
    .map((x) => Math.round(x).toString(16).padStart(2, "0"))
    .join("")}`.toUpperCase();
  return {
    id: `${hex}-${index}`,
    index,
    input,
    hex,
    rgb: { r: Math.round(rgb.r), g: Math.round(rgb.g), b: Math.round(rgb.b) },
    hsl,
    hsv,
    ...spaces,
    temperature,
  };
}

// WCAG 2.0 contrast ratio between two colors. Returns a value between 1 and 21.
export function contrastRatio(a: ColorInfo, b: ColorInfo) {
  const hi = Math.max(a.luminance, b.luminance),
    lo = Math.min(a.luminance, b.luminance);
  return (hi + 0.05) / (lo + 0.05);
}

// Split a free-form string of hex colors (separated by whitespace, commas or semicolons)
// into valid ColorInfo objects and a list of unrecognized tokens.
export function parsePalette(input: string): {
  colors: ColorInfo[];
  invalid: string[];
} {
  const tokens = input
    .split(/[\s,;]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const invalid: string[] = [];
  const colors = tokens.flatMap((token, index) => {
    const color = normalizeColor(token, index);
    if (!color) invalid.push(token);
    return color ? [color] : [];
  });
  return { colors, invalid };
}
