export type EvidenceTopic = "programming" | "recovery" | "nutrition" | "pain";

/**
 * How much the literature actually supports the claim — not how confident we
 * are in our own wording of it.
 *
 * strong   — several well-conducted trials or a meta-analysis pointing the
 *            same way; unlikely to reverse.
 * moderate — a meta-analysis with real heterogeneity, or a consistent
 *            picture built on modest studies.
 * limited  — a single trial, a scoping review, or an area where practice has
 *            run ahead of the evidence.
 */
export type EvidenceStrength = "strong" | "moderate" | "limited";

export type Source = {
  /** As cited: "Schoenfeld BJ, Ogborn D, Krieger JW" */
  authors: string;
  year: number;
  title: string;
  journal: string;
  /** Volume, issue and pages, where the paper has them. */
  locator?: string;
  /** Every source here has one, and it's the link the app shows. */
  doi: string;
};

export type Finding = {
  id: string;
  topic: EvidenceTopic;
  /** The headline in one plain sentence. */
  claim: string;
  /** What it means for someone standing in a gym. */
  practical: string;
  strength: EvidenceStrength;
  /**
   * What the evidence does not say. Present wherever the claim is easy to
   * over-read, which is most of the time.
   */
  limits?: string;
  /** Words that make this finding relevant to a question or a screen. */
  tags: string[];
  sources: Source[];
};

export function sourceUrl(source: Source): string {
  return `https://doi.org/${source.doi}`;
}

/** "Schoenfeld BJ, Ogborn D, Krieger JW (2017), Journal of Sports Sciences" */
export function citation(source: Source): string {
  return `${source.authors} (${source.year}). ${source.title}. ${source.journal}${
    source.locator ? `, ${source.locator}` : ""
  }.`;
}
