"use client";

import Link from "next/link";

/**
 * Asked once of anyone who gave health details before the app asked for
 * consent. Neither answer is pre-selected: consent has to be a clear choice.
 */
export function HealthConsentPrompt({
  busy,
  error,
  onAgree,
  onDecline,
}: {
  busy: boolean;
  error: string | null;
  onAgree: () => void;
  onDecline: () => void;
}) {
  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6 py-10">
      <h1 className="mb-3 text-title1 font-bold text-ink">
        Can we keep using your health details?
      </h1>
      <div className="mb-6 flex flex-col gap-3 text-[15px] leading-relaxed text-ink">
        <p>
          You&apos;ve given us details like your bodyweight or injury notes. These count as health
          information under Australian privacy law, so we need your permission to keep using them.
        </p>
        <p className="text-muted">
          We only use them to make your plan safer and better suited to you — never for marketing, and
          never sold. You can change your mind at any time in Settings.
        </p>
      </div>

      <div className="flex flex-col gap-2.5">
        <button
          onClick={onAgree}
          disabled={busy}
          className="w-full rounded-md bg-accent py-3.5 text-body font-semibold text-accent-ink disabled:opacity-60"
        >
          Yes, keep using them
        </button>
        <button
          onClick={onDecline}
          disabled={busy}
          className="w-full rounded-md bg-surface py-3.5 text-[15px] font-semibold text-ink disabled:opacity-60"
        >
          No, delete them
        </button>
      </div>

      {error && <p className="mt-3 text-subhead text-warning">{error}</p>}

      <p className="mt-5 text-footnote leading-relaxed text-muted">
        More detail in our{" "}
        <Link href="/privacy" target="_blank" className="underline underline-offset-4">
          Privacy Policy
        </Link>
        .
      </p>
    </div>
  );
}
