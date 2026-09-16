import { parsePalette } from "./color";
import { criteria } from "./criteria";
import type { ColorInfo, Direction } from "./types";

// Return -1, 0, or 1 with direction applied.
function compare(a: number | string, b: number | string, direction: Direction) {
  const result = a < b ? -1 : a > b ? 1 : 0;
  return direction === "asc" ? result : -result;
}

// Sort a copy of colors by the given criterion. Ties are broken by original index (stable sort).
export function sortColors(
  colors: ColorInfo[],
  criterion: string,
  direction: Direction,
) {
  if (criterion === "none") return [...colors];
  const definition = criteria[criterion];
  if (!definition) return [...colors];
  return [...colors].sort(
    (a, b) =>
      compare(definition.sortKey(a), definition.sortKey(b), direction) ||
      a.index - b.index,
  );
}

// Rotate an array circularly by offset (positive or negative).
export function rotate<T>(items: T[], offset: number): T[] {
  if (!items.length) return [];
  const n = ((offset % items.length) + items.length) % items.length;
  return [
    ...items.slice(items.length - n),
    ...items.slice(0, items.length - n),
  ];
}

// Parse, sort, and rotate a palette string in one pass.
export function processPalette(
  input: string,
  criterion: string,
  direction: Direction,
  offset = 0,
) {
  const parsed = parsePalette(input);
  return {
    ...parsed,
    sorted: rotate(sortColors(parsed.colors, criterion, direction), offset),
  };
}
