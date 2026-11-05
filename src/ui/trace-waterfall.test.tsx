import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";

import { TraceWaterfall, type TraceSpan } from "./trace-waterfall.js";

const themeColors = new Set(
  Array.from(
    readFileSync(join(import.meta.dir, "../theme.css"), "utf-8").matchAll(
      /--color-([a-z0-9-]+):/g,
    ),
    (match) => match[1],
  ),
);

/** Theme colour names behind an element's `bg-*`/`text-*`/`border-*` classes. */
function colorTokens(element: Element): string[] {
  return Array.from(element.classList).flatMap((name) => {
    const match = /^(?:bg|text|border)-([a-z][a-z-]*)(?:\/\d+)?$/.exec(name);
    return match?.[1] === undefined ? [] : [match[1]];
  });
}

function mount(spans: TraceSpan[]) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(
      createElement(TraceWaterfall, {
        title: "Run trace",
        spans,
      }),
    );
  });
  return { container, unmount: () => root.unmount() };
}

describe("TraceWaterfall", () => {
  test("a measured span (timingSource omitted) renders a duration bar, not a marker", () => {
    const { container, unmount } = mount([
      {
        id: "turn-1",
        label: "Turn",
        kind: "turn",
        start: 0,
        end: 0.5,
        durationLabel: "1.2s",
        phase: "ok",
      },
    ]);
    expect(container.querySelectorAll(".rotate-45").length).toBe(0);
    const bar = container.querySelector(".absolute.inset-y-0");
    expect(bar).not.toBeNull();
    unmount();
  });

  test("a measured span still renders a bar when timingSource is explicitly 'measured'", () => {
    const { container, unmount } = mount([
      {
        id: "turn-1",
        label: "Turn",
        kind: "turn",
        start: 0,
        end: 0.5,
        durationLabel: "1.2s",
        phase: "ok",
        timingSource: "measured",
      },
    ]);
    expect(container.querySelectorAll(".rotate-45").length).toBe(0);
    expect(container.querySelector(".absolute.inset-y-0")).not.toBeNull();
    unmount();
  });

  test("an ordinal span renders as a point marker, not a duration bar", () => {
    const { container, unmount } = mount([
      {
        id: "tool-1",
        label: "search_web",
        kind: "tool",
        start: 0.3,
        end: 0.3,
        durationLabel: null,
        phase: "ok",
        timingSource: "ordinal",
      },
    ]);
    expect(container.querySelector(".absolute.inset-y-0")).toBeNull();
    const marker = container.querySelector(".rotate-45");
    expect(marker).not.toBeNull();
    expect((marker as HTMLElement).style.left).toBe("30%");
    expect((marker as HTMLElement).textContent ?? "").toMatch(
      /approximate|not a measured duration/i,
    );
    unmount();
  });

  test("a null durationLabel renders — in both the inline text and the accessible table", () => {
    const { container, unmount } = mount([
      {
        id: "tool-1",
        label: "search_web",
        kind: "tool",
        start: 0.3,
        end: 0.3,
        durationLabel: null,
        phase: "ok",
        timingSource: "ordinal",
      },
    ]);
    const text = container.textContent ?? "";
    expect(text).toContain("—");

    const tableCells = Array.from(container.querySelectorAll("table td")).map(
      (cell) => cell.textContent,
    );
    expect(tableCells).toContain("—");
    expect(tableCells.some((cell) => cell === "0ms" || cell === "")).toBe(
      false,
    );
    unmount();
  });

  test("a non-null durationLabel is rendered verbatim, not replaced with —", () => {
    const { container, unmount } = mount([
      {
        id: "turn-1",
        label: "Turn",
        kind: "turn",
        start: 0,
        end: 0.5,
        durationLabel: "1.2s",
        phase: "ok",
      },
    ]);
    const tableCells = Array.from(container.querySelectorAll("table td")).map(
      (cell) => cell.textContent,
    );
    expect(tableCells).toContain("1.2s");
    unmount();
  });

  test("awaiting and failed spans colour their bar and error with theme tokens", () => {
    const { container, unmount } = mount([
      {
        id: "approval",
        label: "Approval",
        kind: "gate",
        start: 0.1,
        end: 0.6,
        durationLabel: "4.0s",
        phase: "awaiting",
      },
      {
        id: "fetch",
        label: "fetch_page",
        kind: "tool",
        start: 0.6,
        end: 0.8,
        durationLabel: "0.9s",
        phase: "failed",
        error: "Request timed out",
      },
    ]);
    const bars = Array.from(container.querySelectorAll(".absolute.inset-y-0"));
    expect(bars.map(colorTokens)).toEqual([["warn"], ["destructive"]]);

    const error = Array.from(container.querySelectorAll("p")).find(
      (p) => p.textContent === "Request timed out",
    );
    expect(error).toBeDefined();
    const errorColors = colorTokens(error as Element);
    expect(errorColors).toContain("destructive");
    expect(errorColors).not.toContain("destructive-foreground");

    for (const color of [...bars.flatMap(colorTokens), ...errorColors]) {
      expect(themeColors).toContain(color);
    }
    unmount();
  });
});
