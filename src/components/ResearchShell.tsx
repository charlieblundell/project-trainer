import Link from "next/link";
import { TypeMark } from "@/components/TypeMark";
import { marketingFontClasses } from "@/lib/fonts/marketing";
import type { EvidenceStrength } from "@/lib/evidence";

const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

export function strengthClass(strength: EvidenceStrength): string {
  if (strength === "strong") return "text-success";
  if (strength === "moderate") return "text-accent";
  return "text-muted";
}

/** The frame around the public research pages, matching the landing page. */
export function ResearchShell({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${marketingFontClasses} font-marketing-body min-h-screen bg-background text-ink`}>
      <header className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-6 py-6">
        <TypeMark className="whitespace-nowrap" />
        <nav className="flex items-center gap-5 text-[15px]">
          {/* Redundant on these pages, and on a narrow phone it squeezes the button into two lines. */}
          <Link href="/research" className={`hidden text-muted transition hover:text-ink sm:inline ${focusRing}`}>
            Research
          </Link>
          <Link
            href="/signup"
            className={`whitespace-nowrap rounded-md border border-ink px-4 py-2 font-semibold text-ink transition hover:bg-ink hover:text-background ${focusRing}`}
          >
            Start free
          </Link>
        </nav>
      </header>

      <main className="mx-auto max-w-4xl px-6 pb-20 pt-8">{children}</main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-4xl flex-col gap-3 px-6 py-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>A summary of published research, not medical advice. If something hurts, see a clinician.</p>
          <div className="flex gap-5">
            <Link href="/terms" className={`hover:text-ink ${focusRing}`}>
              Terms of Service
            </Link>
            <Link href="/privacy" className={`hover:text-ink ${focusRing}`}>
              Privacy Policy
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
