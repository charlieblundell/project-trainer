import type { EvidenceStrength, EvidenceTopic } from "./types";

/** Shared by the in-app evidence library and the public research pages. */
export const TOPICS: { id: EvidenceTopic; label: string; blurb: string }[] = [
  {
    id: "programming",
    label: "Training",
    blurb: "Sets, reps, load, effort and rest — the decisions your plan makes for you.",
  },
  {
    id: "recovery",
    label: "Recovery",
    blurb: "Sleep, soreness, easy weeks, and a few popular things that do less than advertised.",
  },
  {
    id: "nutrition",
    label: "Nutrition",
    blurb: "General principles only. Nothing here is personalised dietary advice.",
  },
  {
    id: "pain",
    label: "Pain",
    blurb:
      "How to load a body that's complaining — never how to work out what's wrong with it. See a clinician for that.",
  },
];

export const STRENGTH_LABEL: Record<EvidenceStrength, string> = {
  strong: "Strong evidence",
  moderate: "Moderate evidence",
  limited: "Limited evidence",
};
