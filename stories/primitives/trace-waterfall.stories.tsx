import { TraceWaterfall } from "../../src/ui/trace-waterfall.js";

export default { title: "Primitives / Trace waterfall" };

// One span per phase: ok bars, a hatched awaiting bar, and a failed bar whose
// error prints under the row.
export const Phases = () => (
  <TraceWaterfall
    title="Run trace"
    description="One agent run, four steps"
    spans={[
      {
        id: "plan",
        label: "Plan",
        kind: "turn",
        start: 0,
        end: 0.18,
        durationLabel: "1.4s",
        tokensLabel: "2.1k tok",
        phase: "ok",
      },
      {
        id: "search",
        label: "search_web",
        kind: "tool",
        start: 0.18,
        end: 0.42,
        durationLabel: "1.9s",
        phase: "ok",
      },
      {
        id: "fetch",
        label: "fetch_page",
        kind: "tool",
        start: 0.42,
        end: 0.55,
        durationLabel: "1.0s",
        phase: "failed",
        error: "Request timed out after 1.0s",
      },
      {
        id: "approval",
        label: "Approval",
        kind: "gate",
        start: 0.55,
        end: 1,
        durationLabel: "3.6s",
        phase: "awaiting",
      },
    ]}
  />
);

// Spans positioned by event order only render as point markers.
export const Ordinal = () => (
  <TraceWaterfall
    title="Run trace"
    spans={[
      {
        id: "tool-1",
        label: "search_web",
        kind: "tool",
        start: 0.2,
        end: 0.2,
        durationLabel: null,
        phase: "ok",
        timingSource: "ordinal",
      },
      {
        id: "tool-2",
        label: "send_email",
        kind: "tool",
        start: 0.6,
        end: 0.6,
        durationLabel: null,
        phase: "awaiting",
        timingSource: "ordinal",
      },
      {
        id: "tool-3",
        label: "write_file",
        kind: "tool",
        start: 0.9,
        end: 0.9,
        durationLabel: null,
        phase: "failed",
        timingSource: "ordinal",
        error: "Permission denied",
      },
    ]}
  />
);
