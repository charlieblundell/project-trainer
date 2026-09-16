/**
 * Structural checks on the evidence base, then — with --online — every DOI is
 * resolved against Crossref and the registered title, journal and year are
 * compared to what we wrote down.
 *
 * The point is that a citation nobody can follow is worse than no citation, and
 * a plausible-looking one that doesn't resolve is worse still.
 *
 * Run with: npm run check:evidence  (add -- --online to hit the network)
 */
import { FINDINGS, relevantFindings, type Source } from "../src/lib/evidence";
import { claimsIndex } from "../src/lib/evidence";

const online = process.argv.includes("--online");
let problems = 0;

function fail(message: string) {
  console.log(`  FAIL  ${message}`);
  problems += 1;
}

/* ---------------------------------------------------------------- *
 * Structure
 * ---------------------------------------------------------------- */

console.log(`\nChecking ${FINDINGS.length} findings\n`);

const seen = new Set<string>();
for (const finding of FINDINGS) {
  if (seen.has(finding.id)) fail(`duplicate id: ${finding.id}`);
  seen.add(finding.id);

  if (!/^[a-z0-9-]+$/.test(finding.id)) fail(`id is not kebab-case: ${finding.id}`);
  if (finding.sources.length === 0) fail(`${finding.id} has no source`);
  if (finding.tags.length < 3) fail(`${finding.id} has fewer than 3 tags`);
  if (!finding.claim.endsWith(".")) fail(`${finding.id} claim is not a sentence`);
  if (finding.claim.length > 200) fail(`${finding.id} claim is too long to skim`);

  for (const source of finding.sources) {
    if (!source.doi.startsWith("10.")) fail(`${finding.id} has a malformed DOI: ${source.doi}`);
    if (!source.authors.trim()) fail(`${finding.id} has a source with no authors`);
    if (!source.journal.trim()) fail(`${finding.id} has a source with no journal`);
    if (source.year < 1990 || source.year > new Date().getFullYear() + 1) {
      fail(`${finding.id} has an implausible year: ${source.year}`);
    }
  }

  // Anything thinly evidenced has to say so, or the badge is the only warning.
  if (finding.strength === "limited" && !finding.limits) {
    fail(`${finding.id} is rated 'limited' but doesn't explain what's missing`);
  }
}

const byTopic = new Map<string, number>();
for (const f of FINDINGS) byTopic.set(f.topic, (byTopic.get(f.topic) ?? 0) + 1);
console.log("  By topic: " + [...byTopic].map(([t, n]) => `${t} ${n}`).join(", "));

const byStrength = new Map<string, number>();
for (const f of FINDINGS) byStrength.set(f.strength, (byStrength.get(f.strength) ?? 0) + 1);
console.log("  By strength: " + [...byStrength].map(([s, n]) => `${s} ${n}`).join(", "));

const sources = new Map<string, Source>();
for (const f of FINDINGS) for (const s of f.sources) sources.set(s.doi, s);
console.log(`  Distinct sources: ${sources.size}`);

// The claims index rides along on every coach request, so its size is a
// recurring cost rather than a one-off.
const indexChars = claimsIndex().length;
console.log(`  Claims index: ${indexChars} chars (~${Math.round(indexChars / 4)} tokens/request)`);

/* ---------------------------------------------------------------- *
 * Retrieval
 *
 * Questions people actually ask a trainer. What comes back is what the coach
 * gets handed, so a bad match here is a coach answering from thin air.
 * ---------------------------------------------------------------- */

const QUESTIONS = [
  "how many sets should I be doing?",
  "do I need to train to failure?",
  "I'm not sore the next day, was that a wasted session?",
  "how much protein do I need?",
  "should I take creatine?",
  "my lower back is sore, should I skip legs?",
  "is it bad to use machines instead of free weights?",
  "I missed two weeks on holiday, do I start again?",
  "should I do cardio if I want to build muscle?",
  "I only have 20 minutes today",
  "are ice baths worth it?",
  "I slept badly, should I still train?",
  "I'm 65, is it too late to start lifting?",
  "does my period affect my training?",
  "what's the point of the effort rating?",
];

console.log("\nRetrieval on real questions\n");
for (const question of QUESTIONS) {
  const matches = relevantFindings(question, 3);
  if (matches.length === 0) {
    fail(`nothing matched: "${question}"`);
    continue;
  }
  console.log(`  "${question}"`);
  console.log(`      ${matches.map((m) => m.id).join(", ")}`);
}

/* ---------------------------------------------------------------- *
 * Do these papers exist?
 * ---------------------------------------------------------------- */

/** Loose comparison — punctuation, case and HTML entities differ between registries. */
function normalise(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function verify(source: Source): Promise<void> {
  const res = await fetch(`https://api.crossref.org/works/${encodeURIComponent(source.doi)}`, {
    headers: { "User-Agent": "Your Personal Trainer citation check (mailto:cblundell38@gmail.com)" },
  });

  if (!res.ok) {
    fail(`${source.doi} did not resolve at Crossref (HTTP ${res.status})`);
    return;
  }

  const body = (await res.json()) as {
    message: {
      title?: string[];
      "container-title"?: string[];
      issued?: { "date-parts": number[][] };
    };
  };
  const work = body.message;
  const registeredTitle = work.title?.[0] ?? "";
  const registeredJournal = work["container-title"]?.[0] ?? "";
  const registeredYear = work.issued?.["date-parts"]?.[0]?.[0];

  const ours = normalise(source.title);
  const theirs = normalise(registeredTitle);
  if (!theirs.startsWith(ours.slice(0, 45)) && !ours.startsWith(theirs.slice(0, 45))) {
    fail(`${source.doi} title mismatch\n        ours: ${source.title}\n        real: ${registeredTitle}`);
    return;
  }

  const journalMatches =
    normalise(registeredJournal).includes(normalise(source.journal).slice(0, 12)) ||
    normalise(source.journal).includes(normalise(registeredJournal).slice(0, 12));
  if (registeredJournal && !journalMatches) {
    fail(`${source.doi} journal mismatch: ours "${source.journal}", real "${registeredJournal}"`);
    return;
  }

  // Online-first publication means the year we cite and the year Crossref
  // registered can legitimately differ by one.
  if (registeredYear && Math.abs(registeredYear - source.year) > 1) {
    fail(`${source.doi} year mismatch: ours ${source.year}, real ${registeredYear}`);
    return;
  }

  console.log(`  ok    ${source.doi} — ${registeredTitle.slice(0, 62)}`);
}

async function main() {
  if (online) {
    console.log(`\nResolving ${sources.size} DOIs against Crossref\n`);
    for (const source of sources.values()) {
      try {
        await verify(source);
      } catch (err) {
        fail(`${source.doi} could not be checked: ${(err as Error).message}`);
      }
      // Crossref asks for polite request rates from unauthenticated clients.
      await new Promise((r) => setTimeout(r, 120));
    }
  } else {
    console.log("\n  (run with -- --online to resolve every DOI against Crossref)");
  }

  console.log(problems === 0 ? "\nAll checks passed.\n" : `\n${problems} problem(s).\n`);
  process.exit(problems === 0 ? 0 : 1);
}

main();
