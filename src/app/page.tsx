import Link from "next/link";
import { TypeMark } from "@/components/TypeMark";
import { RedirectIfSignedIn } from "@/components/RedirectIfSignedIn";
import { marketingFontClasses } from "@/lib/fonts/marketing";
import { EQUIPMENT_BY_ENVIRONMENT, EXERCISES, availableExercises } from "@/lib/exercises";
import { FINDINGS, FINDINGS_BY_ID, sourceUrl, type Finding } from "@/lib/evidence";
import { PLANS } from "@/lib/billing/plans";

/*
 * Everything on this page is real. The exercise counts are computed from the
 * library, the research is quoted from the evidence base with its sources,
 * and the notes on the training sheet are the progression engine's own
 * wording for those numbers. Nothing is a placeholder dressed up as a result.
 */

type Week = { label: string; kg: number; reps: number[]; note: string };

/**
 * Three weeks of goblet squats, 3 sets of 8–10, run through the same rules as
 * lib/plan/progress.ts: short of 10 on any set holds the weight; 10 on every
 * set adds 2.5 kg.
 */
const SHEET: Week[] = [
  { label: "Week 1", kg: 12, reps: [9, 8, 8], note: "Staying at 12 kg — aim for 10 reps next time." },
  { label: "Week 2", kg: 12, reps: [10, 10, 10], note: "10 reps on every set at 12 kg, so up to 14.5 kg." },
  { label: "Week 3", kg: 14.5, reps: [8, 8, 7], note: "Staying at 14.5 kg — aim for 10 reps next time." },
];

const KIT = [
  { label: "Nothing at all", detail: "A bit of floor", count: availableExercises(["bodyweight"]).length },
  {
    label: "A few things at home",
    detail: "Dumbbells, bands, a chair",
    count: availableExercises(EQUIPMENT_BY_ENVIRONMENT.Home).length,
  },
  {
    label: "A full gym",
    detail: "Racks, cables, machines",
    count: availableExercises(EQUIPMENT_BY_ENVIRONMENT["Full gym"]).length,
  },
];

const FEATURED_FINDINGS = ["load-range-hypertrophy", "soreness-is-not-a-scorecard", "older-adults-adapt"]
  .map((id) => FINDINGS_BY_ID[id])
  .filter((f): f is Finding => !!f);

function shortCitation(finding: Finding): { text: string; href: string } {
  const source = finding.sources[0];
  const authors = source.authors.split(",");
  const lead = authors[0].trim().split(" ")[0];
  return {
    text: `${lead}${authors.length > 1 ? " et al." : ""}, ${source.journal}, ${source.year}`,
    href: sourceUrl(source),
  };
}

const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

function StartButton({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/signup"
      className={`inline-flex items-center justify-center rounded-md bg-ink px-6 py-3.5 text-[15px] font-semibold text-background transition hover:opacity-90 ${focusRing} ${className}`}
    >
      Start 10 days free
    </Link>
  );
}

function TrainingSheet() {
  return (
    <figure className="rounded-sm border border-line bg-surface shadow-[0_1px_0_var(--line),0_18px_40px_-28px_rgba(30,25,22,0.35)]">
      <div className="flex items-baseline justify-between gap-4 border-b border-line px-5 py-4">
        <div>
          <div className="font-marketing-display text-lg font-bold text-ink [font-stretch:90%]">Goblet squat</div>
          <div className="text-sm text-muted">3 sets of 8–10</div>
        </div>
        <div className="text-right text-xs uppercase tracking-[0.12em] text-muted">Training log</div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[20rem] border-collapse text-[15px]">
          <caption className="sr-only">
            Three weeks of goblet squats, showing the weight held and then increased based on reps logged.
          </caption>
          <thead>
            <tr>
              <th scope="col" className="w-14 px-4 py-3 sm:px-5" />
              {SHEET.map((week, i) => {
                const moved = i > 0 && week.kg !== SHEET[i - 1].kg;
                return (
                  <th key={week.label} scope="col" className="px-3 py-3 text-left align-bottom font-normal">
                    <div className="text-xs uppercase tracking-[0.12em] text-muted">{week.label}</div>
                    <div className="tabular whitespace-nowrap font-marketing-display text-base font-bold text-ink">
                      {moved && (
                        <span className="mr-1.5 font-normal text-muted line-through decoration-accent decoration-2">
                          {SHEET[i - 1].kg}
                        </span>
                      )}
                      <span className={moved ? "text-accent" : undefined}>{week.kg} kg</span>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {[0, 1, 2].map((set) => (
              <tr key={set} className="border-t border-line">
                <th scope="row" className="whitespace-nowrap px-4 py-2.5 text-left text-sm font-normal text-muted sm:px-5">
                  Set {set + 1}
                </th>
                {SHEET.map((week) => {
                  const hitTop = week.reps[set] >= 10;
                  return (
                    <td key={week.label} className="tabular px-3 py-2.5 text-ink">
                      {week.reps[set]}
                      {/* The heading already says "sets of 8–10"; on a phone the word costs the column its width. */}
                      <span className="hidden text-muted sm:inline"> reps</span>
                      {hitTop && <span className="sr-only"> (top of range)</span>}
                    </td>
                  );
                })}
              </tr>
            ))}
            <tr className="border-t border-line align-top">
              <th scope="row" className="px-4 py-3 text-left text-sm font-normal text-muted sm:px-5">
                Next
              </th>
              {SHEET.map((week) => (
                <td key={week.label} className="px-3 py-3 text-sm leading-snug text-accent">
                  {week.note}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      <figcaption className="border-t border-line px-5 py-3 text-xs leading-relaxed text-muted">
        An example run through the app&apos;s real progression rules. The notes in the bottom row
        are its own words.
      </figcaption>
    </figure>
  );
}

export default function Landing() {
  return (
    <div className={`${marketingFontClasses} font-marketing-body bg-background text-ink`}>
      <RedirectIfSignedIn to="/home" />
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <TypeMark />
        <nav className="flex items-center gap-6 text-[15px]">
          <Link href="/signup" className={`text-muted transition hover:text-ink ${focusRing}`}>
            Sign in
          </Link>
          <Link
            href="/signup"
            className={`hidden rounded-md border border-ink px-4 py-2 font-semibold text-ink transition hover:bg-ink hover:text-background sm:inline-flex ${focusRing}`}
          >
            Start free
          </Link>
        </nav>
      </header>

      <main>
        {/* The claim, and the proof of it, side by side. */}
        <section className="mx-auto grid max-w-6xl gap-12 px-6 pb-20 pt-10 md:pt-16 lg:grid-cols-12 lg:items-center lg:gap-10">
          <div className="lg:col-span-5">
            <h1 className="font-marketing-display text-[clamp(2.7rem,7vw,4.6rem)] font-extrabold leading-[0.95] tracking-[-0.015em] text-ink [font-stretch:78%] [text-wrap:balance]">
              Every set you log changes the next one.
            </h1>
            <p className="mt-6 max-w-[34rem] text-lg leading-relaxed text-muted">
              Tell it your goal, the kit you have and how long you&apos;ve got. It writes your week,
              then moves every target from what you actually lift — and shows you the research
              behind its advice.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
              <StartButton />
              <span className="text-[15px] text-muted">No card needed.</span>
            </div>
          </div>

          <div className="lg:col-span-7">
            <TrainingSheet />
          </div>
        </section>

        <section className="border-t border-line">
          <div className="mx-auto grid max-w-6xl gap-10 px-6 py-20 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <h2 className="font-marketing-display text-4xl font-extrabold leading-none text-ink [font-stretch:80%] [text-wrap:balance]">
                Built around the kit you&apos;ve actually got.
              </h2>
              <p className="mt-5 max-w-md text-[17px] leading-relaxed text-muted">
                {EXERCISES.length} exercises, each tagged with the joints it loads — so a sore knee
                or shoulder changes what you&apos;re given, and you&apos;re never handed something you
                can&apos;t do where you are.
              </p>
            </div>

            <dl className="lg:col-span-6 lg:col-start-7">
              {KIT.map((kit) => (
                <div key={kit.label} className="flex items-baseline justify-between gap-6 border-b border-line py-5 first:pt-0">
                  <dt>
                    <div className="text-lg font-semibold text-ink">{kit.label}</div>
                    <div className="text-[15px] text-muted">{kit.detail}</div>
                  </dt>
                  <dd className="text-right">
                    <span className="tabular font-marketing-display text-4xl font-extrabold text-ink [font-stretch:80%]">
                      {kit.count}
                    </span>
                    <span className="ml-2 text-[15px] text-muted">exercises</span>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section className="border-t border-line bg-surface">
          <div className="mx-auto max-w-6xl px-6 py-20">
            <div className="grid gap-6 lg:grid-cols-12">
              <h2 className="font-marketing-display text-4xl font-extrabold leading-none text-ink [font-stretch:80%] lg:col-span-5 [text-wrap:balance]">
                Advice you can check.
              </h2>
              <p className="max-w-xl text-[17px] leading-relaxed text-muted lg:col-span-6 lg:col-start-7">
                The coach works from {FINDINGS.length} findings from published research, each linked
                to its paper and marked with how strong the evidence really is — including where
                it&apos;s thin. A few of them:
              </p>
            </div>

            <ul className="mt-12 grid gap-x-10 gap-y-10 md:grid-cols-3">
              {FEATURED_FINDINGS.map((finding) => {
                const cite = shortCitation(finding);
                return (
                  <li key={finding.id} className="border-t-2 border-ink pt-5">
                    <p className="font-marketing-display text-xl font-bold leading-snug text-ink [font-stretch:92%]">
                      {finding.claim}
                    </p>
                    <p className="mt-3 text-[15px] leading-relaxed text-muted">{finding.practical}</p>
                    <a
                      href={cite.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`mt-4 inline-block text-sm text-accent underline decoration-accent/40 underline-offset-4 hover:decoration-accent ${focusRing}`}
                    >
                      {cite.text}
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        <section className="border-t border-line">
          <div className="mx-auto grid max-w-6xl gap-10 px-6 py-20 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-5">
              <h2 className="font-marketing-display text-4xl font-extrabold leading-none text-ink [font-stretch:80%] [text-wrap:balance]">
                Ten days free. Then decide.
              </h2>
              <p className="mt-5 max-w-md text-[17px] leading-relaxed text-muted">
                Everything, from the first day. No card until you choose to subscribe, and you can
                cancel whenever you like.
              </p>
              <StartButton className="mt-8" />
            </div>

            <dl className="lg:col-span-6 lg:col-start-7">
              {(["month", "year"] as const).map((id) => (
                <div key={id} className="flex items-baseline justify-between gap-6 border-b border-line py-5 first:border-t">
                  <dt>
                    <div className="text-lg font-semibold text-ink">{PLANS[id].label}</div>
                    {PLANS[id].note && <div className="text-[15px] text-accent">{PLANS[id].note}</div>}
                  </dt>
                  <dd className="text-right">
                    <span className="tabular font-marketing-display text-4xl font-extrabold text-ink [font-stretch:80%]">
                      {PLANS[id].price}
                    </span>
                    <span className="ml-2 text-[15px] text-muted">{PLANS[id].per}</span>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
          <TypeMark />
          <div className="flex flex-col gap-2 sm:items-end">
            <p>Training guidance, not medical advice. If something hurts, see a clinician.</p>
            <div className="flex gap-5">
              <Link href="/terms" className={`hover:text-ink ${focusRing}`}>
                Terms of Service
              </Link>
              <Link href="/privacy" className={`hover:text-ink ${focusRing}`}>
                Privacy Policy
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
