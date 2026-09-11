"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { ChevronDown, ExternalLink } from "lucide-react";
import { FINDINGS, STRENGTH_LABEL, TOPICS, citation, sourceUrl } from "@/lib/evidence";
import type { EvidenceStrength, EvidenceTopic, Finding } from "@/lib/evidence";
import { clsx } from "@/lib/clsx";

function StrengthBadge({ strength }: { strength: EvidenceStrength }) {
  return (
    <span
      className={clsx(
        "flex-shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold",
        strength === "strong" && "bg-success-soft text-success",
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
    <div className="rounded-2xl border border-line bg-surface">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-start gap-3 p-4 text-left"
      >
        <div className="flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <StrengthBadge strength={finding.strength} />
          </div>
          <p className="text-sm font-semibold leading-relaxed text-ink">{finding.claim}</p>
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
          <p className="mb-3 text-sm leading-relaxed text-ink">{finding.practical}</p>

          {finding.limits && (
            <div className="mb-3 rounded-xl bg-background p-3">
              <div className="mb-1 text-xs font-semibold text-muted">WHAT IT DOESN&apos;T SAY</div>
              <p className="text-sm leading-relaxed text-muted">{finding.limits}</p>
            </div>
          )}

          <div className="text-xs font-semibold tracking-widest text-muted">
            {finding.sources.length > 1 ? "SOURCES" : "SOURCE"}
          </div>
          <ul className="mt-1.5 flex flex-col gap-2">
            {finding.sources.map((source) => (
              <li key={source.doi}>
                <a
                  href={sourceUrl(source)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-start gap-1.5 text-xs leading-relaxed text-muted hover:text-accent"
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

function EvidenceBody() {
  const params = useSearchParams();
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
      <div className="mb-1 text-xs font-semibold tracking-widest text-muted">THE EVIDENCE</div>
      <h1 className="mb-2 font-display text-2xl font-bold text-ink">Why the app says what it says</h1>
      <p className="mb-5 text-sm leading-relaxed text-muted">
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
              "flex-shrink-0 rounded-xl px-3.5 py-2 text-sm font-semibold transition",
              topic === t.id ? "bg-ink text-background" : "border border-line bg-surface text-muted"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <p className="mb-4 text-sm leading-relaxed text-muted">{active.blurb}</p>

      <div className="flex flex-col gap-2.5">
        {shown.map((finding) => (
          <FindingCard key={finding.id} finding={finding} startOpen={focused.has(finding.id)} />
        ))}
      </div>

      <p className="mt-6 text-xs leading-relaxed text-muted">
        This is a summary of published research, not medical advice. Training and nutrition
        decisions that interact with a health condition, an injury, medication or pregnancy belong
        with a qualified professional who can actually examine you.
      </p>
    </div>
  );
}

export default function Evidence() {
  return (
    <Suspense fallback={<p className="text-sm text-muted">Loading…</p>}>
      <EvidenceBody />
    </Suspense>
  );
}
