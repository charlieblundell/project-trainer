import { Barbell } from "@/components/Wordmark";

/**
 * What shows while the app is opening: the icon, with the plates sliding onto
 * the bar and then a slow lift, over the app's name.
 *
 * Plain CSS keyframes (globals.css) rather than framer, so it's already moving
 * in the server-rendered HTML before any JavaScript has run — which is exactly
 * when it's on screen. It waits a moment before appearing, so a fast load
 * doesn't flash it, and Reduce Motion shows it still.
 */
export function AppLoader({ message }: { message?: string }) {
  const size = 84;
  return (
    <div
      role="status"
      aria-label={message ?? "Loading"}
      className="loader-in flex min-h-screen flex-col items-center justify-center px-6 text-center"
    >
      <div
        className="loader-tile flex items-center justify-center bg-accent shadow-[0_16px_32px_-16px_rgba(0,70,160,0.55)]"
        style={{ width: size, height: size, borderRadius: size * 0.225 }}
      >
        <Barbell size={size} inset={0.14} animated />
      </div>
      <p className="loader-caption mt-5 text-footnote font-semibold text-muted">
        {message ?? "Your Personal Trainer"}
      </p>
    </div>
  );
}
