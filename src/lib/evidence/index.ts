import { PROGRAMMING } from "./programming";
import { RECOVERY } from "./recovery";
import { NUTRITION } from "./nutrition";
import { PAIN } from "./pain";
import type { EvidenceTopic, Finding } from "./types";
import { citation } from "./types";

export * from "./types";

export const FINDINGS: Finding[] = [...PROGRAMMING, ...RECOVERY, ...NUTRITION, ...PAIN];

export const FINDINGS_BY_ID: Record<string, Finding> = Object.fromEntries(
  FINDINGS.map((f) => [f.id, f])
);

export function findingsForTopic(topic: EvidenceTopic): Finding[] {
  return FINDINGS.filter((f) => f.topic === topic);
}

export function findingsByIds(ids: string[]): Finding[] {
  return ids.map((id) => FINDINGS_BY_ID[id]).filter((f): f is Finding => !!f);
}

/* ------------------------------------------------------------------ *
 * Retrieval
 * ------------------------------------------------------------------ */

/** Words too common to tell us anything about what someone is asking. */
const STOPWORDS = new Set([
  "the", "a", "an", "and", "or", "but", "is", "are", "was", "were", "be", "been", "being",
  "i", "im", "me", "my", "you", "your", "it", "its", "this", "that", "these", "those",
  "to", "of", "in", "on", "for", "with", "at", "by", "from", "up", "about", "into", "as",
  "do", "does", "did", "doing", "have", "has", "had", "can", "could", "should", "would",
  "will", "shall", "may", "might", "must", "not", "no", "yes", "if", "so", "than", "then",
  "there", "here", "what", "when", "where", "why", "how", "which", "who", "whom",
  "get", "got", "just", "any", "some", "much", "many", "more", "most", "very", "really",
]);

/**
 * Just enough to stop "ice baths" missing the tag "ice bath". Proper stemming
 * would be overkill for a library this size, and it isn't the plurals that
 * make matching hard.
 */
function stem(word: string): string {
  if (word.length > 4 && word.endsWith("ies")) return `${word.slice(0, -3)}y`;
  if (word.length > 4 && word.endsWith("es")) return word.slice(0, -2);
  if (word.length > 3 && word.endsWith("s") && !word.endsWith("ss")) return word.slice(0, -1);
  return word;
}

function tokenise(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2 && !STOPWORDS.has(word))
    .map(stem);
}

function scoreFinding(finding: Finding, words: Set<string>): number {
  let score = 0;

  for (const tag of finding.tags) {
    // A multi-word tag matching in full is a much stronger signal than one of
    // its words matching, so it's worth more.
    const tagWords = tokenise(tag);
    if (tagWords.length === 0) continue;
    const hits = tagWords.filter((w) => words.has(w)).length;
    if (hits === tagWords.length) score += tagWords.length > 1 ? 6 : 4;
    else if (hits > 0) score += 1;
  }

  // The claim itself carries the vocabulary of the finding, so overlap there
  // catches questions phrased in words nobody thought to add as a tag.
  for (const word of tokenise(finding.claim)) {
    if (words.has(word)) score += 1;
  }

  return score;
}

/**
 * The findings most relevant to a question. Scored on tag and claim overlap
 * rather than anything clever — the library is small enough that a keyword
 * match is honest about what it can do, and a wrong guess here costs only a
 * few unused tokens.
 */
export function relevantFindings(query: string, limit = 6): Finding[] {
  const words = new Set(tokenise(query));
  if (words.size === 0) return [];

  return FINDINGS.map((finding) => ({ finding, score: scoreFinding(finding, words) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.finding.id.localeCompare(b.finding.id))
    .slice(0, limit)
    .map((entry) => entry.finding);
}

/* ------------------------------------------------------------------ *
 * Rendering for the coach
 * ------------------------------------------------------------------ */

/**
 * Every claim in one line each. Cheap enough to send on every request, and it
 * stops the coach contradicting something in the library just because that
 * finding didn't happen to match the question.
 */
export function claimsIndex(): string {
  return FINDINGS.map((f) => `- [${f.id}] (${f.strength}) ${f.claim}`).join("\n");
}

/** The full entry, for the handful of findings a question actually touches. */
export function detailFor(findings: Finding[]): string {
  return findings
    .map((f) => {
      const lines = [
        `[${f.id}] ${f.claim}`,
        `  Evidence strength: ${f.strength}`,
        `  In practice: ${f.practical}`,
      ];
      if (f.limits) lines.push(`  What it doesn't say: ${f.limits}`);
      for (const source of f.sources) lines.push(`  Source: ${citation(source)}`);
      return lines.join("\n");
    })
    .join("\n\n");
}
