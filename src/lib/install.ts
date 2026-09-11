import { create } from "zustand";

/** Chrome's install prompt event. Not part of the standard DOM types. */
export interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

type InstallState = {
  /** The saved prompt, if the browser has offered one. It can only be used once. */
  promptEvent: BeforeInstallPromptEvent | null;
  setPromptEvent: (event: BeforeInstallPromptEvent | null) => void;
};

export const useInstallStore = create<InstallState>((set) => ({
  promptEvent: null,
  setPromptEvent: (event) => set({ promptEvent: event }),
}));

let started = false;

/**
 * The browser fires its install prompt once, often before anyone has reached
 * Settings, so it's caught as soon as the app loads and kept until the
 * Install button is pressed.
 */
export function startInstallListener() {
  if (started || typeof window === "undefined") return;
  started = true;

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    useInstallStore.getState().setPromptEvent(event as BeforeInstallPromptEvent);
  });

  window.addEventListener("appinstalled", () => {
    useInstallStore.getState().setPromptEvent(null);
  });

  // Chrome only offers its install prompt once a service worker handles page
  // loads. Production only: in development it would get in the way of
  // hot reloading.
  if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Without it the app still works; it just can't be offered for install.
    });
  }
}

export function isRunningInstalled(): boolean {
  if (typeof window === "undefined") return false;
  const iosStandalone = (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return iosStandalone || window.matchMedia("(display-mode: standalone)").matches;
}

export function isIos(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}
