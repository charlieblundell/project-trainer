import type { MetadataRoute } from "next";

/**
 * Lets the site be installed to a phone's home screen, where it opens full
 * screen without the browser's address bar — the closest thing to an app
 * without going through the app stores.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Your Personal Trainer",
    short_name: "Trainer",
    description: "A training plan that adapts to every set you log.",
    // Straight into the app. Anyone not signed in is sent to sign-up from there.
    start_url: "/home",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f2f2f7",
    theme_color: "#f2f2f7",
    categories: ["health", "fitness", "sports"],
    icons: [
      { src: "/pwa-icon/192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/pwa-icon/512", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/pwa-icon/maskable", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
