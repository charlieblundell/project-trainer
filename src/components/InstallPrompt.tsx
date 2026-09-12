"use client";

import { useState } from "react";
import { EllipsisVertical, Share, SquarePlus } from "lucide-react";
import { clsx } from "@/lib/clsx";
import {
  dismissInstallPrompt,
  installPromptDismissed,
  isInAppBrowser,
  isIos,
  isMobileDevice,
  isRunningInstalled,
  useInstallStore,
} from "@/lib/install";

/**
 * Gets the app onto someone's home screen, with instructions matched to the
 * phone in their hand: a real Install button where the browser offers one,
 * the three taps on an iPhone, and a way out of Instagram's built-in browser,
 * which can't install anything.
 *
 * Only rendered inside screens that appear after the browser has loaded, so
 * reading the browser directly in initial state can't mismatch server HTML.
 */
export function InstallPrompt({
  className,
  dismissible = false,
  mobileOnly = false,
  showInstalled = false,
}: {
  className?: string;
  /** Offer "Not now", which hides it for 14 days. */
  dismissible?: boolean;
  /** Hide on desktop, where installing matters much less. */
  mobileOnly?: boolean;
  /** Say so when it's already installed, rather than disappearing. */
  showInstalled?: boolean;
}) {
  const promptEvent = useInstallStore((s) => s.promptEvent);
  const setPromptEvent = useInstallStore((s) => s.setPromptEvent);
  const [installed, setInstalled] = useState(() => isRunningInstalled());
  const [dismissed, setDismissed] = useState(() => dismissible && installPromptDismissed());
  const [device] = useState(() => ({ ios: isIos(), inApp: isInAppBrowser(), mobile: isMobileDevice() }));

  if (dismissed) return null;
  if (mobileOnly && !device.mobile) return null;

  if (installed) {
    if (!showInstalled) return null;
    return (
      <div className={clsx("rounded-[20px] bg-surface px-4 py-3.5", className)}>
        <div className="text-subhead font-semibold text-ink">Installed</div>
        <div className="text-footnote leading-relaxed text-muted">You&apos;re using the app from your home screen.</div>
      </div>
    );
  }

  async function install() {
    if (!promptEvent) return;
    await promptEvent.prompt();
    const choice = await promptEvent.userChoice;
    // A prompt can only be used once, whatever they chose.
    setPromptEvent(null);
    if (choice.outcome === "accepted") setInstalled(true);
  }

  function notNow() {
    dismissInstallPrompt();
    setDismissed(true);
  }

  return (
    <div className={clsx("rounded-[20px] bg-surface p-4", className)}>
      <div className="mb-1 text-subhead font-semibold text-ink">Put it on your home screen</div>
      <p className="mb-3 text-footnote leading-relaxed text-muted">
        Opens in one tap, full screen, straight into your plan — like any other app.
      </p>

      {device.inApp ? (
        <p className="text-subhead leading-relaxed text-ink">
          You&apos;re viewing this inside another app, which can&apos;t add it to your home screen. Tap the{" "}
          <span className="font-semibold">•••</span> menu, choose{" "}
          <span className="font-semibold">Open in browser</span>, then add it from Safari or Chrome.
        </p>
      ) : promptEvent ? (
        <button
          onClick={install}
          className="w-full rounded-[12px] bg-accent py-2.5 text-body font-semibold text-accent-ink"
        >
          Install the app
        </button>
      ) : device.ios ? (
        <ol className="flex flex-col gap-2.5 text-subhead text-ink">
          <li className="flex items-center gap-3">
            <Step n={1} />
            <span>
              Tap <Share size={15} className="-mt-0.5 inline text-accent" aria-hidden="true" />{" "}
              <span className="font-semibold">Share</span>
              <span className="text-muted"> (in Chrome, it&apos;s in the address bar)</span>
            </span>
          </li>
          <li className="flex items-center gap-3">
            <Step n={2} />
            <span>
              Scroll down and tap <SquarePlus size={15} className="-mt-0.5 inline text-accent" aria-hidden="true" />{" "}
              <span className="font-semibold">Add to Home Screen</span>
            </span>
          </li>
          <li className="flex items-center gap-3">
            <Step n={3} />
            <span>
              Tap <span className="font-semibold">Add</span>
            </span>
          </li>
        </ol>
      ) : device.mobile ? (
        <p className="text-subhead leading-relaxed text-ink">
          In Chrome, tap <EllipsisVertical size={15} className="-mt-0.5 inline text-accent" aria-hidden="true" />{" "}
          the menu, then <span className="font-semibold">Add to Home screen</span> or{" "}
          <span className="font-semibold">Install app</span>.
        </p>
      ) : (
        <p className="text-subhead leading-relaxed text-ink">
          Open this site on your phone, sign in, and add it to your home screen from there — it&apos;s where the app
          works best.
        </p>
      )}

      {dismissible && (
        <button onClick={notNow} className="mt-3 text-footnote font-semibold text-muted hover:text-ink">
          Not now
        </button>
      )}
    </div>
  );
}

function Step({ n }: { n: number }) {
  return (
    <span
      aria-hidden="true"
      className="tabular flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md bg-accent-soft text-footnote font-bold text-accent"
    >
      {n}
    </span>
  );
}
