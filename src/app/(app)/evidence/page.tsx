"use client";

import { ListSkeleton } from "@/components/Skeleton";
import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { ChevronDown, ChevronLeft, ExternalLink } from "lucide-react";
import { FINDINGS, STRENGTH_LABEL, TOPICS, citation, sourceUrl } from "@/lib/evidence";
import type { EvidenceStrength, EvidenceTopic, Finding } from "@/lib/evidence";
import { clsx } from "@/lib/clsx";
import { previousScreen } from "@/lib/navigation";

function StrengthBadge({ strength }: { strength: EvidenceStrength }) {
  return (
    <span
      className={clsx(
        "flex-shrink-0 rounded-full px-2 py-1 text-[11px] font-semibold",
        strength === "strong" && "bg-success-soft text-success-ink",
        strength === "moderate" && "bg-accent-soft text-accent",
        strength === "limited" && "border border-line text-muted"
      )}
    >
      {STRENGTH_LABEL[strength]}
    </span>
  );
}

function FindingCard({ finding, startOpen }: { finding: Finding; startOpen: boolean }) {
  const [open, setOpen] = useState(startOpen);

  return (
    <div className="rounded-[20px] bg-surface shadow-card">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-start gap-3 p-4 text-left"
      >
        <div className="flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <StrengthBadge strength={finding.strength} />
          </div>
          <p className="text-subhead font-semibold leading-relaxed text-ink">{finding.claim}</p>
        </div>
        <ChevronDown
          size={18}
          className={clsx("mt-1 flex-shrink-0 text-muted transition-transform", open && "rotate-180")}
        />
      </button>

      {open && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="border-t border-line px-4 pb-4 pt-3"
        >
          <p className="mb-3 text-subhead leading-relaxed text-ink">{finding.practical}</p>

          {finding.limits && (
            <div className="mb-3 rounded-[12px] bg-background p-3">
              <div className="mb-1 text-footnote font-semibold text-muted">What it doesn&apos;t say</div>
              <p className="text-subhead leading-relaxed text-muted">{finding.limits}</p>
            </div>
          )}

          <div className="text-footnote font-semibold text-muted">
            {finding.sources.length > 1 ? "Sources" : "Source"}
          </div>
          <ul className="mt-1.5 flex flex-col gap-2">
            {finding.sources.map((source) => (
              <li key={source.doi}>
                <a
                  href={sourceUrl(source)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-start gap-1.5 text-footnote leading-relaxed text-muted hover:text-accent"
                >
                  <span>{citation(source)}</span>
                  <ExternalLink size={12} className="mt-0.5 flex-shrink-0" />
                </a>
              </li>
            ))}
          </ul>
        </motion.div>
      )}
    </div>
  );
}

/*
 * Where Back goes when there's no in-app history to return through: a link
 * opened fresh, or the installed app reopened on this screen. An installed app
 * has no browser Back button, so without one of these the screen was a dead end.
 */
const CAME_FROM: Record<string, { label: string; screen: string }> = {
  why: { label: "Back", screen: "/plan/why" },
  settings: { label: "Settings", screen: "/settings" },
};

function EvidenceBody() {
  const router = useRouter();
  const params = useSearchParams();
  const from = CAME_FROM[params.get("from") ?? ""];
  const rule = params.get("rule");
  const label = from?.label ?? "Back";
  // Where to go when that screen isn't actually behind us — reopening the rule
  // sheet they came from, if there was one.
  const fallback = from ? `${from.screen}${rule && from.screen === "/plan/why" ? `?rule=${rule}` : ""}` : "/plan";

  /*
   * Through history only when the screen behind is the one the button names,
   * so it comes back exactly as it was left. Otherwise straight to it: a
   * button labelled "Settings" never takes anyone Home.
   */
  const goBack = () => {
    const behind = previousScreen();
    const expected = from?.screen;
    if (behind && (!expected || behind === expected)) router.back();
    else router.push(fallback);
  };
  // A link from elsewhere in the app can name the findings behind a decision.
  const focused = useMemo(() => {
    const raw = params.get("ids");
    return new Set(raw ? raw.split(",").filter(Boolean) : []);
  }, [params]);

  const [topic, setTopic] = useState<EvidenceTopic>(() => {
    const first = FINDINGS.find((f) => focused.has(f.id));
    return first?.topic ?? "programming";
  });

  const shown = useMemo(() => {
    const inTopic = FINDINGS.filter((f) => f.topic === topic);
    if (focused.size === 0) return inTopic;
    // Whatever was linked to comes first; the rest of the topic stays available.
    return [...inTopic].sort(
      (a, b) => Number(focused.has(b.id)) - Number(focused.has(a.id))
    );
  }, [topic, focused]);

  const active = TOPICS.find((t) => t.id === topic)!;

  return (
    <div>
      <button
        onClick={goBack}
        className="-ml-1 mb-2 flex min-h-[44px] items-center gap-0.5 text-body text-accent"
      >
        <ChevronLeft size={22} strokeWidth={2.2} /> {label}
      </button>
      <div className="mb-1 text-footnote font-semibold text-muted">The evidence</div>
      <h1 className="mb-2 text-largetitle font-bold text-ink">Why the app says what it says</h1>
      <p className="mb-5 text-subhead leading-relaxed text-muted">
        {FINDINGS.length} findings behind your plan and your coach. Every one links to the paper it
        came from, and says plainly how strong the evidence actually is — including where it&apos;s
        thin.
      </p>

      <div className="mb-4 -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
        {TOPICS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTopic(t.id)}
            className={clsx(
              "flex min-h-[44px] flex-shrink-0 items-center rounded-[12px] px-3.5 text-subhead font-semibold transition",
              topic === t.id ? "bg-accent text-accent-ink" : "bg-surface text-muted"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <p className="mb-4 text-subhead leading-relaxed text-muted">{active.blurb}</p>

      <div className="flex flex-col gap-2.5">
        {shown.map((finding) => (
          <FindingCard key={finding.id} finding={finding} startOpen={focused.has(finding.id)} />
        ))}
      </div>

      <p className="mt-6 text-footnote leading-relaxed text-muted">
        This is a summary of published research, not medical advice. Training and nutrition
        decisions that interact with a health condition, an injury, medication or pregnancy belong
        with a qualified professional who can actually examine you.
      </p>
    </div>
  );
}

export default function Evidence() {
  return (
    <Suspense fallback={<ListSkeleton count={5} />}>
      <EvidenceBody />
    </Suspense>
  );
}
