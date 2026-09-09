import Link from "next/link";
import { Button } from "@/components/Button";
import { Wordmark } from "@/components/Wordmark";

const STEPS = [
  { title: "Build", body: "Tell us your goal, schedule and equipment." },
  { title: "Train", body: "Follow your personalised program and log your performance." },
  { title: "Adapt", body: "Your next workouts change based on how you actually perform." },
];

export default function Landing() {
  return (
    <div className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute -top-40 -right-40 h-[480px] w-[480px] rounded-full opacity-[0.15] blur-3xl"
        style={{ background: "radial-gradient(circle, var(--accent-2), transparent 70%)" }}
      />
      <div
        className="pointer-events-none absolute -bottom-32 -left-32 h-[380px] w-[380px] rounded-full opacity-[0.12] blur-3xl"
        style={{ background: "radial-gradient(circle, var(--accent), transparent 70%)" }}
      />

      <div className="relative mx-auto flex min-h-screen max-w-5xl flex-col px-6 py-10 md:py-16">
        <Wordmark className="mb-16 md:mb-24" />

        <div className="grid gap-12 md:grid-cols-2 md:items-center md:gap-16">
          <div>
            <h1 className="font-display text-4xl font-bold leading-[1.05] tracking-tight text-ink md:text-6xl">
              Your personal trainer.
              <br />
              Adapted to you.
            </h1>
            <p className="mt-5 max-w-md text-[15px] leading-relaxed text-muted md:text-base">
              Build a personalised training plan, track every workout, and let your coach adjust it
              as you go. No guessing what to do next.
            </p>

            <div className="mt-8 max-w-xs">
              <Link href="/signup">
                <Button>Build my plan</Button>
              </Link>
            </div>

            <div className="mt-14 flex flex-col gap-5">
              {STEPS.map((step, i) => (
                <div key={step.title} className="flex gap-4">
                  <div className="font-mono w-6 pt-0.5 text-sm font-semibold text-accent tabular">
                    {i + 1}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-ink">{step.title}</div>
                    <div className="text-sm leading-relaxed text-muted">{step.body}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-line bg-surface p-6 shadow-sm">
            <div className="mb-4 text-xs font-semibold tracking-widest text-muted">
              TODAY&apos;S WORKOUT &mdash; UPPER BODY
            </div>
            {[
              ["Bench Press", "62.5 kg · 3x8"],
              ["Incline DB Press", "24 kg · 3x10"],
              ["Lat Pulldown", "60 kg · 3x10"],
              ["Lateral Raise", "10 kg · 3x12"],
            ].map(([name, spec]) => (
              <div key={name} className="flex justify-between border-t border-line py-3 first:border-t-0">
                <span className="text-sm text-ink">{name}</span>
                <span className="tabular text-sm text-muted">{spec}</span>
              </div>
            ))}
            <div className="mt-4 rounded-xl bg-accent-soft px-4 py-3 text-sm text-accent">
              Coach: &ldquo;You&apos;re up 4% on bench this month &mdash; nice consistency.&rdquo;
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
