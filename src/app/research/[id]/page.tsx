import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FINDINGS, FINDINGS_BY_ID, STRENGTH_LABEL, TOPICS, citation, sourceUrl } from "@/lib/evidence";
import { ResearchShell, strengthClass } from "@/components/ResearchShell";
import { SITE_NAME } from "@/lib/site";

type Props = { params: Promise<{ id: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return FINDINGS.map((finding) => ({ id: finding.id }));
}

/** Search results show about 160 characters. */
function snippet(text: string): string {
  return text.length <= 160 ? text : `${text.slice(0, 157).trimEnd()}…`;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const finding = FINDINGS_BY_ID[id];
  if (!finding) return {};
  const description = snippet(finding.practical);
  return {
    title: `${finding.claim} — ${SITE_NAME}`,
    description,
    alternates: { canonical: `/research/${id}` },
    openGraph: {
      type: "article",
      siteName: SITE_NAME,
      title: finding.claim,
      description,
      url: `/research/${id}`,
    },
  };
}

const sectionHeading = "mt-10 text-sm font-semibold uppercase tracking-[0.12em] text-muted";

export default async function FindingPage({ params }: Props) {
  const { id } = await params;
  const finding = FINDINGS_BY_ID[id];
  if (!finding) notFound();

  const topic = TOPICS.find((t) => t.id === finding.topic) ?? TOPICS[0];
  const related = FINDINGS.filter((f) => f.topic === finding.topic && f.id !== finding.id).slice(0, 3);

  return (
    <ResearchShell>
      <nav aria-label="Breadcrumb" className="text-sm text-muted">
        <Link href="/research" className="hover:text-ink">
          Research
        </Link>
        <span aria-hidden="true"> / </span>
        <Link href={`/research#${topic.id}`} className="hover:text-ink">
          {topic.label}
        </Link>
      </nav>

      <article className="mt-8 max-w-[68ch]">
        <p className={`text-xs font-semibold uppercase tracking-[0.12em] ${strengthClass(finding.strength)}`}>
          {STRENGTH_LABEL[finding.strength]}
        </p>
        <h1 className="mt-3 font-marketing-display text-[clamp(2rem,5vw,3.1rem)] font-extrabold leading-[1.02] text-ink [font-stretch:85%] [text-wrap:balance]">
          {finding.claim}
        </h1>

        <h2 className={sectionHeading}>In practice</h2>
        <p className="mt-3 text-[18px] leading-[1.7] text-ink">{finding.practical}</p>

        {finding.limits && (
          <>
            <h2 className={sectionHeading}>What it doesn&apos;t say</h2>
            <p className="mt-3 text-[17px] leading-[1.7] text-muted">{finding.limits}</p>
          </>
        )}

        <h2 className={sectionHeading}>{finding.sources.length > 1 ? "Sources" : "Source"}</h2>
        <ul className="mt-3 flex flex-col gap-3">
          {finding.sources.map((source) => (
            <li key={source.doi} className="text-[15px] leading-relaxed text-muted">
              {citation(source)}{" "}
              <a
                href={sourceUrl(source)}
                target="_blank"
                rel="noopener noreferrer"
                className="break-all text-accent underline decoration-accent/40 underline-offset-4 hover:decoration-accent"
              >
                doi.org/{source.doi}
              </a>
            </li>
          ))}
        </ul>
      </article>

      <aside className="mt-14 rounded-md border border-line bg-surface p-6">
        <p className="font-marketing-display text-2xl font-bold leading-tight text-ink [font-stretch:90%] [text-wrap:balance]">
          A training plan that works from research like this.
        </p>
        <p className="mt-2 max-w-[56ch] text-[15px] leading-relaxed text-muted">
          {SITE_NAME} builds your week around your goal and the kit you&apos;ve got, moves every target from what you
          actually lift, and shows its sources when it gives advice.
        </p>
        <Link
          href="/signup"
          className="mt-5 inline-flex rounded-md bg-ink px-6 py-3 text-[15px] font-semibold text-background transition hover:opacity-90"
        >
          Start free
        </Link>
      </aside>

      {related.length > 0 && (
        <section className="mt-14">
          <h2 className="font-marketing-display text-2xl font-bold text-ink [font-stretch:90%]">
            More on {topic.label.toLowerCase()}
          </h2>
          <ul className="mt-4 border-t border-line">
            {related.map((other) => (
              <li key={other.id} className="border-b border-line">
                <Link
                  href={`/research/${other.id}`}
                  className="block py-4 text-[16px] leading-snug text-ink transition hover:text-accent"
                >
                  {other.claim}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </ResearchShell>
  );
}
