"use client";

import { useState } from "react";
import { clsx } from "@/lib/clsx";
import { SITE_NAME } from "@/lib/site";

/**
 * Opens the phone's own share sheet with a link to the app, or copies the link
 * where there isn't one. The person chooses who gets it and writes their own
 * message: the app sends nothing and offers nothing in return for sharing.
 * `ref=invite` lets analytics count visits that came from a share.
 */
export function InviteFriends({ className }: { className?: string }) {
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");
  const [link, setLink] = useState("");

  async function share() {
    const url = `${window.location.origin}/?ref=invite`;
    setLink(url);

    if (navigator.share) {
      try {
        await navigator.share({ title: SITE_NAME, url });
        return;
      } catch (err) {
        // Closing the share sheet isn't a failure.
        if (err instanceof DOMException && err.name === "AbortError") return;
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setStatus("copied");
    } catch {
      setStatus("failed");
    }
  }

  return (
    <div className={clsx("rounded-[20px] bg-surface px-4 py-3.5", className)}>
      <div className="text-subhead font-semibold text-ink">Know someone who&apos;d use this?</div>
      <div className="text-footnote leading-relaxed text-muted">
        Send them a link. They answer their own questions and get a plan built for them.
      </div>
      <button
        onClick={share}
        className="mt-3 w-full min-h-[48px] rounded-[12px] border border-line text-subhead font-semibold text-ink"
      >
        {status === "copied" ? "Link copied" : "Share the app"}
      </button>
      {status === "failed" && (
        <p className="mt-2 select-all break-all text-footnote text-muted">Copy this link: {link}</p>
      )}
    </div>
  );
}
