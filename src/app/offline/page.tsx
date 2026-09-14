import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Offline — Your Personal Trainer",
};

/*
 * Shown by the service worker when there's no connection and the page asked
 * for has never been opened on this phone, so there's no copy to show. The
 * main screens are kept ahead of time, so this is rare. It's cached as plain
 * HTML without its stylesheet or scripts, so every style is inline: the page
 * has to read properly with nothing else available.
 */
export default function Offline() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        background: "#f6f3ee",
        color: "#000000",
        fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
      }}
    >
      <div style={{ maxWidth: 360 }}>
        <h1 style={{ fontSize: 30, fontWeight: 800, lineHeight: 1.1, margin: "0 0 10px" }}>You&apos;re offline.</h1>
        <p style={{ margin: "0 0 20px", fontSize: 16, lineHeight: 1.6, color: "rgba(62,57,52,0.8)" }}>
          This page hasn&apos;t been opened on this phone yet, so there&apos;s no copy of it to show. Your plan
          and workouts still work: head back to Home.
        </p>
        <Link
          href="/home"
          style={{
            display: "inline-block",
            background: "#0068e0",
            color: "#ffffff",
            padding: "12px 20px",
            borderRadius: 12,
            fontWeight: 600,
            fontSize: 15,
            textDecoration: "none",
          }}
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
