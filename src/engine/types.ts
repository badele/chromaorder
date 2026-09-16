// Sort direction for palette ordering.
export type Direction = "asc" | "desc";

// All color space representations computed for a single color.
// hsl.h and hsv.h are null for achromatic colors (black, white, gray).
export interface ColorInfo {
  id: string;
  index: number;
  input: string;
  hex: string;
  rgb: { r: number; g: number; b: number };
  hsl: { h: number | null; s: number; l: number };
  hsv: { h: number | null; s: number; v: number };
  lab: { l: number; a: number; b: number };
  oklab: { l: number; a: number; b: number };
  oklch: { l: number; c: number; h: number | null };
  luminance: number;
  temperature: number;
}

export type CriterionId = string;

// A named sorting criterion: label and category are shown in the UI dropdown,
// sortKey extracts the comparable value from a color.
export interface SortCriterionDefinition {
  id: CriterionId;
  label: string;
  category: string;
  sortKey: (color: ColorInfo) => number | string;
}
