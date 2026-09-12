import Image from "next/image";
import Link from "next/link";
import { TypeMark } from "@/components/TypeMark";
import { RedirectIfSignedIn } from "@/components/RedirectIfSignedIn";
import { marketingFontClasses } from "@/lib/fonts/marketing";
import { EQUIPMENT_BY_ENVIRONMENT, EXERCISES, availableExercises } from "@/lib/exercises";
import { FINDINGS, FINDINGS_BY_ID, sourceUrl, type Finding } from "@/lib/evidence";
import { PLANS } from "@/lib/billing/plans";

/*
 * Everything on this page is real: the screenshots are the app, the exercise
 * counts are computed from the library, the research is quoted from the
 * evidence base with its sources, and the notes on the training sheet are the
 * progression engine's own wording. Nothing is a placeholder dressed up as a
 * result.
 *
 * The hero band is deliberately dark and sets its colours literally rather
 * than through the theme tokens, which flip with the viewer's system setting —
 * the screenshots are of the app's dark mode and need a dark ground under them.
 */

const DARK = "#17120f";
const DARK_SURFACE = "#241d19";
const DARK_LINE = "#3a302a";
const ON_DARK = "#f4efe9";
const ON_DARK_MUTED = "#a0948b";
const ON_DARK_ACCENT = "#ef7d4e";

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

/* ------------------------------------------------------------------ *
 * Screenshots
 * ------------------------------------------------------------------ */

const SHOT_WIDTH = 1170;
const SHOT_HEIGHT = 2532;
/**
 * The phone's own status bar, which doesn't belong on a landing page. These
 * are taken from the installed app, so what sits at the bottom is the app's
 * own navigation — that stays.
 */
const STATUS_BAR = 120;

/**
 * One app screenshot in a phone frame, cropped without touching the file:
 * the wrapper keeps the cropped aspect ratio and the image is nudged up by
 * exactly the part being hidden.
 */
function Screen({
  src,
  alt,
  cropTop = STATUS_BAR,
  eager = false,
  className = "",
}: {
  src: string;
  alt: string;
  cropTop?: number;
  eager?: boolean;
  className?: string;
}) {
  const visible = SHOT_HEIGHT - cropTop;

  return (
    <div
      className={`overflow-hidden rounded-[1.6rem] border-[3px] shadow-[0_30px_60px_-30px_rgba(0,0,0,0.75)] ${className}`}
      style={{ borderColor: DARK_LINE, background: DARK_SURFACE, aspectRatio: `${SHOT_WIDTH} / ${visible}` }}
    >
      <Image
        src={src}
        alt={alt}
        width={SHOT_WIDTH}
        height={SHOT_HEIGHT}
        sizes="(min-width: 1024px) 300px, 44vw"
        loading={eager ? "eager" : "lazy"}
        fetchPriority={eager ? "high" : undefined}
        className="block w-full"
        style={{ transform: `translateY(${-(cropTop / SHOT_HEIGHT) * 100}%)` }}
      />
    </div>
  );
}

function StartButton({ className = "", dark = false }: { className?: string; dark?: boolean }) {
  return (
    <Link
      href="/signup"
      className={`inline-flex items-center justify-center rounded-md px-6 py-3.5 text-[15px] font-semibold transition hover:opacity-90 ${
        dark ? "" : `bg-ink text-background ${focusRing}`
      } ${className}`}
      style={dark ? { background: ON_DARK, color: DARK } : undefined}
    >
      Start free
    </Link>
  );
}

function TrainingSheet() {
  return (
    <figure className="rounded-sm border border-line bg-surface shadow-[0_1px_0_var(--line),0_18px_40px_-28px_rgba(30,25,22,0.35)]">
      <div className="flex items-baseline justify-between gap-4 border-b border-line px-5 py-3.5">
        <div>
          <div className="font-marketing-display text-lg font-bold text-ink [font-stretch:105%]">Goblet squat</div>
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
        An example run through the app&apos;s real progression rules. The notes in the bottom row are its own words.
      </figcaption>
    </figure>
  );
}

export default function Landing() {
  return (
    <div className={`${marketingFontClasses} font-marketing-body bg-background text-ink`}>
      <RedirectIfSignedIn />

      {/* The claim, and the app itself, on the ground the screenshots were taken on. */}
      <div style={{ background: DARK, color: ON_DARK }}>
        <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          {/* The wordmark carries the theme's ink colour, which is near-black on this ground. */}
          <span style={{ color: ON_DARK }}>
            <TypeMark className="!text-inherit" />
          </span>
          <nav className="flex items-center gap-6 text-[15px]">
            <Link href="/signup" className="transition hover:opacity-70" style={{ color: ON_DARK_MUTED }}>
              Sign in
            </Link>
            <Link
              href="/signup"
              className="hidden rounded-md border px-4 py-2 font-semibold transition hover:opacity-80 sm:inline-flex"
              style={{ borderColor: DARK_LINE, color: ON_DARK }}
            >
              Start free
            </Link>
          </nav>
        </header>

        <section className="mx-auto grid max-w-6xl items-center gap-10 px-6 pb-14 pt-6 lg:grid-cols-12 lg:gap-8 lg:pb-20 lg:pt-10">
          <div className="lg:col-span-6">
            <div
              className="mb-5 inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em]"
              style={{ background: "rgba(239,125,78,0.14)", color: ON_DARK_ACCENT }}
            >
              Free while we&apos;re in early access
            </div>
            <h1
              className="font-marketing-display text-[clamp(2.5rem,6vw,4.1rem)] font-extrabold leading-[0.98] tracking-[-0.02em] [font-stretch:112%] [text-wrap:balance]"
              style={{ color: ON_DARK }}
            >
              Every set you log changes the next one.
            </h1>
            <p className="mt-5 max-w-[32rem] text-[17px] leading-relaxed" style={{ color: ON_DARK_MUTED }}>
              Tell it your goal, the kit you have and how long you&apos;ve got. It writes your week, then moves every
              target from what you actually lift — and shows you the research behind its advice.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3">
              <StartButton dark />
              <span className="text-[15px]" style={{ color: ON_DARK_MUTED }}>
                No card needed.
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:col-span-6 lg:gap-4">
            {/* Cropped below the greeting: the name there belongs to whoever took the screenshot. */}
            <Screen src="/screens/home.png" alt="The app's home screen: today's session, with the week below it." cropTop={400} eager />
            <Screen
              src="/screens/train.png"
              alt="Logging a set during a workout, with the rest timer counting down."
              className="mt-8"
            />
          </div>
        </section>
      </div>

      <main>
        <section className="border-b border-line">
          <div className="mx-auto grid max-w-6xl items-center gap-8 px-6 py-14 lg:grid-cols-12 lg:gap-10">
            <div className="lg:col-span-5">
              <h2 className="font-marketing-display text-[clamp(1.9rem,3.4vw,2.6rem)] font-extrabold leading-[1.02] text-ink [font-stretch:110%] [text-wrap:balance]">
                It reads what you lifted, then moves the target.
              </h2>
              <p className="mt-4 max-w-md text-[16px] leading-relaxed text-muted">
                Hit the top of the rep range on every set and the weight goes up. Fall short and it holds. You never
                have to work out what to do next — but you can change any of it whenever you like.
              </p>
            </div>
            <div className="lg:col-span-7">
              <TrainingSheet />
            </div>
          </div>
        </section>

        <section className="border-b border-line">
          <div className="mx-auto grid max-w-6xl gap-8 px-6 py-14 lg:grid-cols-12 lg:gap-10">
            <div className="lg:col-span-5">
              <h2 className="font-marketing-display text-[clamp(1.9rem,3.4vw,2.6rem)] font-extrabold leading-[1.02] text-ink [font-stretch:110%] [text-wrap:balance]">
                Built around the kit you&apos;ve actually got.
              </h2>
              <p className="mt-4 max-w-md text-[16px] leading-relaxed text-muted">
                {EXERCISES.length} exercises, each tagged with the joints it loads — so a sore knee or shoulder changes
                what you&apos;re given, and you&apos;re never handed something you can&apos;t do where you are.
              </p>
            </div>

            <dl className="lg:col-span-6 lg:col-start-7">
              {KIT.map((kit) => (
                <div key={kit.label} className="flex items-baseline justify-between gap-6 border-b border-line py-4 first:border-t">
                  <dt>
                    <div className="text-[17px] font-semibold text-ink">{kit.label}</div>
                    <div className="text-[15px] text-muted">{kit.detail}</div>
                  </dt>
                  <dd className="text-right">
                    <span className="tabular font-marketing-display text-3xl font-extrabold text-ink [font-stretch:105%]">
                      {kit.count}
                    </span>
                    <span className="ml-2 text-[15px] text-muted">exercises</span>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section className="border-b border-line bg-surface">
          <div className="mx-auto grid max-w-6xl gap-8 px-6 py-14 lg:grid-cols-12 lg:gap-10">
            <div className="lg:col-span-7">
              <h2 className="font-marketing-display text-[clamp(1.9rem,3.4vw,2.6rem)] font-extrabold leading-[1.02] text-ink [font-stretch:110%] [text-wrap:balance]">
                A coach that shows its sources.
              </h2>
              <p className="mt-4 max-w-xl text-[16px] leading-relaxed text-muted">
                Ask it anything about your training and it answers from your own plan, your equipment and{" "}
                {FINDINGS.length} findings from published research — each linked to its paper and marked with how
                strong the evidence really is, including where it&apos;s thin.
              </p>

              <ul className="mt-8 grid gap-6 sm:grid-cols-2">
                {FEATURED_FINDINGS.slice(0, 2).map((finding) => {
                  const cite = shortCitation(finding);
                  return (
                    <li key={finding.id} className="border-t-2 border-ink pt-4">
                      <p className="font-marketing-display text-[19px] font-bold leading-snug text-ink [font-stretch:105%]">
                        {finding.claim}
                      </p>
                      <p className="mt-2.5 text-[15px] leading-relaxed text-muted">{finding.practical}</p>
                      <a
                        href={cite.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`mt-3 inline-block text-sm text-accent underline decoration-accent/40 underline-offset-4 hover:decoration-accent ${focusRing}`}
                      >
                        {cite.text}
                      </a>
                    </li>
                  );
                })}
              </ul>

              <Link
                href="/research"
                className={`mt-8 inline-block text-[15px] font-semibold text-ink underline decoration-ink/30 underline-offset-4 hover:decoration-ink ${focusRing}`}
              >
                Read all {FINDINGS.length} findings
              </Link>
            </div>

            <div className="mx-auto w-full max-w-[16rem] lg:col-span-4 lg:col-start-9 lg:max-w-none">
              <Screen src="/screens/coach.png" alt="The coach answering a question about swapping an exercise." />
            </div>
          </div>
        </section>

        <section className="border-b border-line">
          <div className="mx-auto grid max-w-6xl gap-8 px-6 py-14 lg:grid-cols-12 lg:items-center lg:gap-10">
            <div className="mx-auto w-full max-w-[16rem] lg:col-span-4 lg:max-w-none">
              <Screen src="/screens/plan.png" alt="The week view, showing which day each session falls on." />
            </div>

            <div className="lg:col-span-7 lg:col-start-6">
              <h2 className="font-marketing-display text-[clamp(1.9rem,3.4vw,2.6rem)] font-extrabold leading-[1.02] text-ink [font-stretch:110%] [text-wrap:balance]">
                Your week, and it&apos;s yours to change.
              </h2>
              <p className="mt-4 max-w-xl text-[16px] leading-relaxed text-muted">
                Move sessions to different days, rename them, add or drop exercises, and set your own sets, reps and
                rest. Already have a program you like? Skip the written plan and build your week yourself — the app
                still tracks it and still moves your targets.
              </p>
            </div>
          </div>
        </section>

        <section>
          <div className="mx-auto grid max-w-6xl gap-8 px-6 py-14 lg:grid-cols-12 lg:items-end lg:gap-10">
            <div className="lg:col-span-5">
              <h2 className="font-marketing-display text-[clamp(1.9rem,3.4vw,2.6rem)] font-extrabold leading-[1.02] text-ink [font-stretch:110%] [text-wrap:balance]">
                Free while we&apos;re in early access.
              </h2>
              <p className="mt-4 max-w-md text-[16px] leading-relaxed text-muted">
                Everything, from the first day, with no card. Subscriptions aren&apos;t open yet — when they are,
                you&apos;ll get at least seven more days free before you&apos;d need to decide.
              </p>
              <StartButton className="mt-7" />
            </div>

            <dl className="lg:col-span-6 lg:col-start-7">
              <div className="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-muted">What it will cost</div>
              {(["month", "year"] as const).map((id) => (
                <div key={id} className="flex items-baseline justify-between gap-6 border-b border-line py-4 first:border-t">
                  <dt>
                    <div className="text-[17px] font-semibold text-ink">{PLANS[id].label}</div>
                    {PLANS[id].note && <div className="text-[15px] text-accent">{PLANS[id].note}</div>}
                  </dt>
                  <dd className="text-right">
                    <span className="tabular font-marketing-display text-3xl font-extrabold text-ink [font-stretch:105%]">
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
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-7 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
          <TypeMark />
          <div className="flex flex-col gap-2 sm:items-end">
            <p>Training guidance, not medical advice. If something hurts, see a clinician.</p>
            <div className="flex gap-5">
              <Link href="/research" className={`hover:text-ink ${focusRing}`}>
                Research
              </Link>
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
