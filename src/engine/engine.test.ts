import { describe, expect, it } from "vitest";
import { normalizeColor, parsePalette, processPalette, rotate } from "./index";

describe("color engine", () => {
  it("preserves null hue for achromatic colors", () => {
    expect(normalizeColor("#808080", 0)?.oklch.h).toBeNull();
    expect(normalizeColor("#fff", 0)?.hsl.h).toBeNull();
  });
  it("parses separators and reports invalid values", () => {
    const result = parsePalette("#fff, #ff0000; nope\n#000");
    expect(result.colors).toHaveLength(3);
    expect(result.invalid).toEqual(["nope"]);
  });
  it("rotates positive and negative offsets cyclically", () => {
    expect(rotate(["A", "B", "C", "D"], 2)).toEqual(["C", "D", "A", "B"]);
    expect(rotate(["A", "B", "C", "D"], -2)).toEqual(["C", "D", "A", "B"]);
  });
  it("sorts stably when values are equal", () => {
    const result = processPalette("#fff #fff #000", "rgb.r", "asc");
    expect(result.sorted.map((c) => c.index)).toEqual([2, 0, 1]);
  });
});
