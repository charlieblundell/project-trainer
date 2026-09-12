import { ImageResponse } from "next/og";
import { AppMark } from "@/components/AppMark";

/*
 * The picture a shared link shows. Same claim as the landing page, and the
 * same goblet squat example, run through the app's real progression rules.
 */

export const alt = "Your Personal Trainer: every set you log changes the next one.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const INK = "#000000";
const PAPER = "#f2f2f7";
const MUTED = "#7a706a";
const TERRACOTTA = "#007aff";
const LINE = "#eae2da";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: PAPER,
          color: INK,
          padding: "60px 72px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
          <div style={{ display: "flex", borderRadius: 14, overflow: "hidden" }}>
            <AppMark size={64} />
          </div>
          <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: 5, textTransform: "uppercase" }}>
            Your Personal Trainer
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 88, fontWeight: 700, lineHeight: 1.02, letterSpacing: -2, maxWidth: 980 }}>
            Every set you log changes the next one.
          </div>
          <div style={{ marginTop: 26, fontSize: 32, lineHeight: 1.35, color: MUTED, maxWidth: 940 }}>
            A plan built for your goal and your kit, with a coach that shows its research.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
            fontSize: 28,
            borderTop: `2px solid ${LINE}`,
            paddingTop: 26,
          }}
        >
          <span style={{ color: INK, fontWeight: 700 }}>Goblet squat</span>
          <span style={{ color: MUTED }}>10 reps on every set at 12 kg, so</span>
          <span style={{ color: MUTED, textDecoration: "line-through" }}>12 kg</span>
          <span style={{ color: TERRACOTTA, fontWeight: 700 }}>14.5 kg</span>
        </div>
      </div>
    ),
    { ...size }
  );
}
