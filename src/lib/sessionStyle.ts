import { Dumbbell, Footprints, HeartPulse, Target, type LucideIcon } from "lucide-react";
import type { CSSProperties } from "react";
import type { PlannedSession } from "@/lib/plan/types";

/*
 * Each kind of session gets its own colour and symbol, so a week reads at a
 * glance — push days look like push days wherever they appear — the way
 * Fitness colours its rings and Calendar its calendars.
 *
 * Every pair is dark enough that white text passes 4.5:1 on its lighter end;
 * `solid` is that lighter end, set as the background colour underneath the
 * gradient so the contrast audit measures the worst case.
 */
export type SessionStyle = { from: string; to: string; solid: string; icon: LucideIcon };

const STYLES = {
  push: { from: "#0a4db3", to: "#0068e0", solid: "#0068e0", icon: Dumbbell },
  pull: { from: "#4c1d95", to: "#6d3fd6", solid: "#6d3fd6", icon: Dumbbell },
  legs: { from: "#9a2b0a", to: "#bf4010", solid: "#bf4010", icon: Footprints },
  full: { from: "#0b5e4a", to: "#0f7a5f", solid: "#0f7a5f", icon: Dumbbell },
  core: { from: "#0f4c6e", to: "#16678f", solid: "#16678f", icon: Target },
  cardio: { from: "#9f1239", to: "#c0224f", solid: "#c0224f", icon: HeartPulse },
} satisfies Record<string, SessionStyle>;

export function sessionStyle(session: Pick<PlannedSession, "name" | "region">): SessionStyle {
  const name = session.name.toLowerCase();
  if (/push|chest|shoulder/.test(name)) return STYLES.push;
  if (/pull|back|arm/.test(name)) return STYLES.pull;
  if (/leg|lower|glute/.test(name)) return STYLES.legs;
  if (/cardio|condition|interval|endurance|run/.test(name)) return STYLES.cardio;
  if (/core/.test(name)) return STYLES.core;
  if (session.region === "upper") return STYLES.push;
  if (session.region === "lower") return STYLES.legs;
  if (session.region === "core") return STYLES.core;
  return STYLES.full;
}

export function sessionBackground(style: SessionStyle): CSSProperties {
  return { backgroundColor: style.solid, backgroundImage: `linear-gradient(135deg, ${style.from}, ${style.to})` };
}
