import Link from "next/link";
import { TypeMark } from "@/components/TypeMark";
import { marketingFontClasses } from "@/lib/fonts/marketing";

/** Shared by the Terms and Privacy Policy so both read the same way. */
export const LEGAL_LAST_UPDATED = "11 September 2026";

export const OPERATOR = {
  name: "Charles James Blundell",
  email: "cblundell38@gmail.com",
  location: "Tasmania, Australia",
} as const;

export function LegalPage({
  title,
  summary,
  children,
}: {
  title: string;
  summary: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className={`${marketingFontClasses} font-marketing-body min-h-screen bg-background text-ink`}>
      <header className="mx-auto flex max-w-3xl items-center justify-between px-6 py-6">
        <TypeMark />
        <nav className="flex gap-5 text-[15px] text-muted">
          <Link href="/terms" className="hover:text-ink">
            Terms
          </Link>
          <Link href="/privacy" className="hover:text-ink">
            Privacy
          </Link>
        </nav>
      </header>

      <main className="mx-auto max-w-3xl px-6 pb-24 pt-8">
        <h1 className="font-marketing-display text-5xl font-extrabold leading-none text-ink [font-stretch:80%]">
          {title}
        </h1>
        <p className="mt-3 text-[15px] text-muted">Last updated {LEGAL_LAST_UPDATED}</p>

        <aside className="mt-8 rounded-md border border-line bg-surface p-5">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-[0.12em] text-muted">
            The short version
          </h2>
          <div className="flex flex-col gap-2 text-[16px] leading-relaxed text-ink">{summary}</div>
          <p className="mt-3 text-sm text-muted">
            This summary is here to help. The full text below is what applies.
          </p>
        </aside>

        <div className="legal-body mt-10 flex flex-col gap-10 text-[17px] leading-[1.7] text-ink">{children}</div>
      </main>
    </div>
  );
}

export function Section({ id, number, title, children }: {
  id: string;
  number: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-6">
      <h2 className="mb-3 font-marketing-display text-2xl font-bold leading-tight text-ink [font-stretch:90%]">
        <span className="tabular mr-2 text-muted">{number}.</span>
        {title}
      </h2>
      <div className="flex max-w-[68ch] flex-col gap-3">{children}</div>
    </section>
  );
}

export function Bullets({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="flex list-disc flex-col gap-1.5 pl-5 marker:text-muted">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}

export function EmailLink() {
  return (
    <a href={`mailto:${OPERATOR.email}`} className="text-accent underline underline-offset-4">
      {OPERATOR.email}
    </a>
  );
}
