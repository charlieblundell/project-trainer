import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Offline — Your Personal Trainer",
};

/*
 * Shown by the service worker when a page can't load. It's cached as plain
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
        background: "#f2f2f7",
        color: "#000000",
        fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
      }}
    >
      <div style={{ maxWidth: 360 }}>
        <h1 style={{ fontSize: 30, fontWeight: 800, lineHeight: 1.1, margin: "0 0 10px" }}>You&apos;re offline.</h1>
        <p style={{ margin: "0 0 20px", fontSize: 16, lineHeight: 1.6, color: "rgba(60,60,67,0.6)" }}>
          Your plan and workouts need a connection to load and save. Check your signal or Wi-Fi, then try again.
        </p>
        <Link
          href="/home"
          style={{
            display: "inline-block",
            background: "#007aff",
            color: "#ffffff",
            padding: "12px 20px",
            borderRadius: 12,
            fontWeight: 600,
            fontSize: 15,
            textDecoration: "none",
          }}
        >
          Try again
        </Link>
      </div>
    </div>
  );
}
