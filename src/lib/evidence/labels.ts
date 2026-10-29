import type { Agreement, EvidenceStrength, EvidenceTopic, StudyDesign } from "./types";

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

export const AGREEMENT_LABEL: Record<Agreement, string> = {
  consistent: "Studies agree",
  mostly: "Most studies agree",
  mixed: "Studies disagree",
};

/** One line on what the agreement label means, for anyone who taps it. */
export const AGREEMENT_EXPLAIN: Record<Agreement, string> = {
  consistent: "The research points the same way.",
  mostly: "Most of the research points this way; some studies found no difference.",
  mixed: "Studies disagree. What's written here is the cautious reading, not a settled answer.",
};

export const DESIGN_LABEL: Record<StudyDesign, string> = {
  "umbrella-review": "Review of meta-analyses",
  "meta-analysis": "Meta-analysis",
  "systematic-review": "Systematic review",
  consensus: "Expert consensus",
  trial: "Single study",
  review: "Narrative review",
};
