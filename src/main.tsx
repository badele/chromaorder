import { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  criteria,
  contrastRatio,
  processPalette,
  type ColorInfo,
  type Direction,
} from "./engine";

function applyVisualizer(
  c: ColorInfo,
  visualizer: Visualizer | undefined,
): string {
  if (!visualizer) return c.hex;
  const photoFilter = photoFilters[visualizer];
  if (photoFilter) {
    const [r, g, b] = [c.rgb.r, c.rgb.g, c.rgb.b].map((ch, i) =>
      Math.round(ch * photoFilter[i]),
    );
    return `rgb(${r} ${g} ${b})`;
  }
  const linear = Math.max(0, Math.min(1, c.luminance));
  const encoded =
    linear <= 0.0031308 ? 12.92 * linear : 1.055 * linear ** (1 / 2.4) - 0.055;
  const printLevel = Math.round(encoded * 255);
  const level =
    visualizer === "bw-document" ? (printLevel >= 128 ? 255 : 0) : printLevel;
  return `rgb(${level} ${level} ${level})`;
}
import "./style.css";
import "./layout.css";

const initial =
  "#E63946\n#F4A261\n#FFBE0B\n#06D6A0\n#2A9D8F\n#457B9D\n#3A86FF\n#8338EC";
type Visualizer =
  | "photo-black"
  | "photo-red"
  | "photo-green"
  | "photo-blue"
  | "photo-yellow"
  | "photo-orange"
  | "photo-cyan"
  | "photo-magenta"
  | "bw-print"
  | "bw-document";

const photoFilters: Record<string, [number, number, number]> = {
  "photo-black": [0, 0, 0],
  "photo-red": [1, 0, 0],
  "photo-green": [0, 1, 0],
  "photo-blue": [0, 0, 1],
  "photo-yellow": [1, 1, 0],
  "photo-orange": [1, 0.5, 0],
  "photo-cyan": [0, 1, 1],
  "photo-magenta": [1, 0, 1],
};

function Swatches({
  colors,
  onSelect,
  visualizer,
  contrastWith,
}: {
  colors: ColorInfo[];
  onSelect: (c: ColorInfo) => void;
  visualizer?: Visualizer;
  contrastWith?: ColorInfo;
}) {
  return (
    <div className="swatches">
      {colors.map((c) => (
        <button
          key={c.id}
          className="swatch"
          style={{
            background: applyVisualizer(c, visualizer),
            color: contrastWith?.hex,
          }}
          title={c.hex}
          onClick={() => onSelect(c)}
        >
          {contrastWith && (
            <span className="swatch-ratio">
              <strong>RATIO</strong>
              <span>{contrastRatio(c, contrastWith).toFixed(2)}</span>
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

function App() {
  const [input, setInput] = useState(initial),
    [criterion, setCriterion] = useState("none"),
    [direction, setDirection] = useState<Direction>("asc"),
    [offset, setOffset] = useState(0),
    [selected, setSelected] = useState<ColorInfo | null>(null),
    [showContrast, setShowContrast] = useState(false),
    [foreground, setForeground] = useState("#000000"),
    [visualizer, setVisualizer] = useState<Visualizer>("bw-print"),
    [copied, setCopied] = useState(false),
    [darkMode, setDarkMode] = useState(
      () => localStorage.getItem("chromaorder-theme") === "dark",
    );
  useEffect(() => {
    document.documentElement.classList.toggle("dark-mode", darkMode);
    document.body.classList.toggle("dark-mode", darkMode);
    localStorage.setItem("chromaorder-theme", darkMode ? "dark" : "light");
  }, [darkMode]);
  const result = useMemo(() => {
    return processPalette(input, criterion, direction, offset);
  }, [input, criterion, direction, offset]);
  const foregroundColor = processPalette(foreground, "none", "asc").colors[0];
  return (
    <main>
      <header>
        <div>
          <h1>ChromaOrder</h1>
          <p className="subtitle">
            Reorganize your palettes using a clear and explicit criterion.
          </p>
        </div>
        <div className="header-actions">
          <button
            className="theme-button"
            onClick={() => setDarkMode(!darkMode)}
            aria-label="Change theme"
          >
            {darkMode ? "☀" : "☾"}
          </button>
        </div>
      </header>
      <section className="grid">
        <div className="panel input-panel">
          <label>INPUT PALETTE</label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            spellCheck={false}
          />
          <Swatches colors={result.colors} onSelect={setSelected} />
        </div>
        <div className="panel">
          <label>ORGANIZE PALETTE</label>
          <p className="muted">Choose one sorting criterion.</p>
          <select
            value={criterion}
            onChange={(e) => setCriterion(e.target.value)}
          >
            <option value="none">No sort · Original order</option>
            {Object.values(criteria).map((c) => (
              <option key={c.id} value={c.id}>
                {c.category} · {c.label}
              </option>
            ))}
          </select>
          {criterion !== "none" && (
            <div className="direction">
              <button
                className={direction === "asc" ? "active" : ""}
                onClick={() => setDirection("asc")}
              >
                ASC
              </button>
              <button
                className={direction === "desc" ? "active" : ""}
                onClick={() => setDirection("desc")}
              >
                DESC
              </button>
            </div>
          )}
          <label>
            ROTATION <span className="muted">{offset}</span>
          </label>
          <div className="rotation">
            <button onClick={() => setOffset(offset - 1)}>−</button>
            <input
              type="range"
              min={-Math.max(result.colors.length, 1)}
              max={Math.max(result.colors.length, 1)}
              value={offset}
              onChange={(e) => setOffset(+e.target.value)}
            />
            <button onClick={() => setOffset(offset + 1)}>+</button>
            <button className="reset" onClick={() => setOffset(0)}>
              Reset
            </button>
          </div>
          <label>VISUALIZER</label>
          <select
            className="visualizer-select control-select"
            value={visualizer}
            onChange={(e) => setVisualizer(e.target.value as Visualizer)}
          >
            <option value="bw-print">Black &amp; white print</option>
            <option value="bw-document">Pure black &amp; white document</option>
            <option value="photo-black">Black photo filter</option>
            <option value="photo-red">Red photo filter</option>
            <option value="photo-green">Green photo filter</option>
            <option value="photo-blue">Blue photo filter</option>
            <option value="photo-yellow">Yellow photo filter</option>
            <option value="photo-orange">Orange photo filter</option>
            <option value="photo-cyan">Cyan photo filter</option>
            <option value="photo-magenta">Magenta photo filter</option>
          </select>
        </div>
      </section>
      <section className="panel result">
        <div className="result-heading">
          <div>
            <label>SORTED PALETTE</label>
            <h2>{result.sorted.length} colors</h2>
          </div>
          <div className="result-heading-actions">
            <button
              className={`copy-button${copied ? " copied" : ""}`}
              onClick={() => {
                navigator.clipboard?.writeText(
                  result.sorted.map((c) => c.hex).join("\n"),
                );
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
            >
              {copied ? "✓ Copied!" : "Copy HEX"}
            </button>
          </div>
        </div>
        <div className="contrast-controls">
          <label className="contrast-toggle">
            <input
              type="checkbox"
              checked={showContrast}
              onChange={(e) => setShowContrast(e.target.checked)}
            />{" "}
            Show WCAG ratio
          </label>
          {showContrast && (
            <label className="foreground-picker">
              Foreground{" "}
              <input
                type="color"
                value={foreground}
                onChange={(e) => setForeground(e.target.value.toUpperCase())}
              />
              <code>{foreground}</code>
            </label>
          )}
        </div>
        <Swatches
          colors={result.sorted}
          onSelect={setSelected}
          contrastWith={showContrast ? foregroundColor : undefined}
        />
        <div className="hexes">
          {result.sorted.map((c) => (
            <span key={c.id}>{c.hex}</span>
          ))}
        </div>
        <div className="viewer-heading">
          <div>
            <label>FILTERED PALETTE</label>
          </div>
        </div>
        <Swatches
          colors={result.sorted}
          onSelect={setSelected}
          visualizer={visualizer}
        />
      </section>
      {selected && (
        <aside className="inspector panel">
          <button className="close" onClick={() => setSelected(null)}>
            ×
          </button>
          <div className="big-swatch" style={{ background: selected.hex }} />
          <h2>{selected.hex}</h2>
          <dl className="color-values">
            <dt>RGB</dt>
            <dd>
              <span className="value-name">R</span> {selected.rgb.r}
            </dd>
            <dd>
              <span className="value-name">G</span> {selected.rgb.g}
            </dd>
            <dd>
              <span className="value-name">B</span> {selected.rgb.b}
            </dd>

            <dt>HSL</dt>
            <dd>
              <span className="value-name">H</span>{" "}
              {selected.hsl.h === null ? "—" : `${selected.hsl.h.toFixed(1)}°`}
            </dd>
            <dd>
              <span className="value-name">S</span>{" "}
              {(selected.hsl.s * 100).toFixed(1)}%
            </dd>
            <dd>
              <span className="value-name">L</span>{" "}
              {(selected.hsl.l * 100).toFixed(1)}%
            </dd>

            <dt>OKLab</dt>
            <dd>
              <span className="value-name">L</span>{" "}
              {selected.oklab.l.toFixed(3)}
            </dd>
            <dd>
              <span className="value-name">a</span>{" "}
              {selected.oklab.a.toFixed(3)}
            </dd>
            <dd>
              <span className="value-name">b</span>{" "}
              {selected.oklab.b.toFixed(3)}
            </dd>

            <dt>OKLCH</dt>
            <dd>
              <span className="value-name">L</span>{" "}
              {selected.oklch.l.toFixed(3)}
            </dd>
            <dd>
              <span className="value-name">C</span>{" "}
              {selected.oklch.c.toFixed(3)}
            </dd>
            <dd>
              <span className="value-name">H</span>{" "}
              {selected.oklch.h === null
                ? "—"
                : `${selected.oklch.h.toFixed(1)}°`}
            </dd>
          </dl>
        </aside>
      )}
    </main>
  );
}
createRoot(document.getElementById("root")!).render(<App />);
