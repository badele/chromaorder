import type { ColorInfo, SortCriterionDefinition } from "./types";

// CriteriaMap omits id since it is derived from the dict key at build time.
type CriteriaMap = Record<string, Omit<SortCriterionDefinition, "id">>;

// Each entry defines a sortable color attribute.
// Hue fields fall back to 360 so achromatic colors (hue == null) sort last.
const raw: CriteriaMap = {
  "rgb.r": {
    label: "Red channel",
    category: "RGB",
    sortKey: (c: ColorInfo) => c.rgb.r,
  },
  "rgb.g": {
    label: "Green channel",
    category: "RGB",
    sortKey: (c: ColorInfo) => c.rgb.g,
  },
  "rgb.b": {
    label: "Blue channel",
    category: "RGB",
    sortKey: (c: ColorInfo) => c.rgb.b,
  },
  "hsl.h": {
    label: "HSL hue",
    category: "HSL",
    sortKey: (c: ColorInfo) => c.hsl.h ?? 360,
  },
  "hsl.s": {
    label: "HSL saturation",
    category: "HSL",
    sortKey: (c: ColorInfo) => c.hsl.s,
  },
  "hsl.l": {
    label: "HSL lightness",
    category: "HSL",
    sortKey: (c: ColorInfo) => c.hsl.l,
  },
  "hsv.h": {
    label: "HSV hue",
    category: "HSV",
    sortKey: (c: ColorInfo) => c.hsv.h ?? 360,
  },
  "hsv.s": {
    label: "HSV saturation",
    category: "HSV",
    sortKey: (c: ColorInfo) => c.hsv.s,
  },
  "hsv.v": {
    label: "HSV value",
    category: "HSV",
    sortKey: (c: ColorInfo) => c.hsv.v,
  },
  "oklab.l": {
    label: "OKLab lightness",
    category: "OKLab",
    sortKey: (c: ColorInfo) => c.oklab.l,
  },
  "oklab.a": {
    label: "OKLab a",
    category: "OKLab",
    sortKey: (c: ColorInfo) => c.oklab.a,
  },
  "oklab.b": {
    label: "OKLab b",
    category: "OKLab",
    sortKey: (c: ColorInfo) => c.oklab.b,
  },
  "oklch.l": {
    label: "OKLCH lightness",
    category: "OKLCH",
    sortKey: (c: ColorInfo) => c.oklch.l,
  },
  "oklch.c": {
    label: "OKLCH chroma",
    category: "OKLCH",
    sortKey: (c: ColorInfo) => c.oklch.c,
  },
  "oklch.h": {
    label: "OKLCH hue",
    category: "OKLCH",
    sortKey: (c: ColorInfo) => c.oklch.h ?? 360,
  },
  luminance: {
    label: "Relative luminance",
    category: "WCAG",
    sortKey: (c: ColorInfo) => c.luminance,
  },
  temperature: {
    label: "Temperature",
    category: "Semantic",
    sortKey: (c: ColorInfo) => c.temperature,
  },
};

// Inject id into each entry from its dict key.
export const criteria: Record<string, SortCriterionDefinition> =
  Object.fromEntries(
    Object.entries(raw).map(([id, def]) => [id, { id, ...def }]),
  );
