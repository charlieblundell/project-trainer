import type { Metadata } from "next";
import Link from "next/link";
import { FINDINGS, STRENGTH_LABEL, TOPICS } from "@/lib/evidence";
import { ResearchShell, strengthClass } from "@/components/ResearchShell";
import { SITE_NAME } from "@/lib/site";

const DESCRIPTION = `${FINDINGS.length} findings from published research on training, recovery, nutrition and pain. Each one links to its paper and says plainly how strong the evidence is.`;

export const metadata: Metadata = {
  title: `The research behind the training — ${SITE_NAME}`,
  description: DESCRIPTION,
  alternates: { canonical: "/research" },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: "Advice you can check",
    description: DESCRIPTION,
    url: "/research",
  },
};

/** The evidence library, readable without an account, so people can find it through search. */
export default function ResearchIndex() {
  return (
    <ResearchShell>
      <h1 className="font-marketing-display text-[clamp(2.5rem,6vw,3.9rem)] font-extrabold leading-[0.95] tracking-[-0.01em] text-ink [font-stretch:80%] [text-wrap:balance]">
        Advice you can check.
      </h1>
      <p className="mt-5 max-w-[60ch] text-lg leading-relaxed text-muted">
        The plans and coach in {SITE_NAME} work from {FINDINGS.length} findings from published research. Each one
        links to the paper it came from and says how strong the evidence really is — including where it&apos;s thin.
      </p>

      <nav aria-label="Topics" className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-[15px]">
        {TOPICS.map((topic) => (
          <a
            key={topic.id}
            href={`#${topic.id}`}
            className="text-accent underline decoration-accent/40 underline-offset-4 hover:decoration-accent"
          >
            {topic.label}
          </a>
        ))}
      </nav>

      {TOPICS.map((topic) => {
        const findings = FINDINGS.filter((f) => f.topic === topic.id);
        return (
          <section key={topic.id} id={topic.id} className="mt-16 scroll-mt-6">
            <div className="flex items-baseline justify-between gap-4">
              <h2 className="font-marketing-display text-3xl font-extrabold leading-none text-ink [font-stretch:85%]">
                {topic.label}
              </h2>
              <span className="tabular text-sm text-muted">{findings.length} findings</span>
            </div>
            <p className="mt-3 max-w-[60ch] text-[16px] leading-relaxed text-muted">{topic.blurb}</p>

            <ul className="mt-6 border-t border-line">
              {findings.map((finding) => (
                <li key={finding.id} className="border-b border-line">
                  <Link
                    href={`/research/${finding.id}`}
                    className="group flex flex-col gap-1.5 py-5 sm:flex-row sm:items-baseline sm:gap-8"
                  >
                    <span
                      className={`w-44 flex-shrink-0 text-xs font-semibold uppercase tracking-[0.12em] ${strengthClass(finding.strength)}`}
                    >
                      {STRENGTH_LABEL[finding.strength]}
                    </span>
                    <span className="text-[17px] leading-snug text-ink transition group-hover:text-accent">
                      {finding.claim}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </ResearchShell>
  );
}
