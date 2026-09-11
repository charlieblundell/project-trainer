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
  // iPads report themselves as Macs; a touch screen gives them away.
  const iPadOs = /Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1;
  return iPadOs || /iphone|ipad|ipod/i.test(navigator.userAgent);
}

/**
 * Browsers built into other apps — Instagram, Facebook, TikTok — can't add a
 * site to the home screen. People arriving from social posts land in them.
 */
export function isInAppBrowser(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Instagram|FBAN|FBAV|FB_IAB|TikTok|musical_ly|Snapchat|Line\//i.test(navigator.userAgent);
}

export function isMobileDevice(): boolean {
  if (typeof window === "undefined") return false;
  return isIos() || /android/i.test(navigator.userAgent) || window.matchMedia("(pointer: coarse)").matches;
}

const DISMISS_KEY = "install-prompt-dismissed-at";
const DISMISS_DAYS = 14;

/** "Not now" hides the prompt for a fortnight, then it comes back. Settings always has it. */
export function installPromptDismissed(): boolean {
  try {
    const at = Number(localStorage.getItem(DISMISS_KEY));
    return !!at && Date.now() - at < DISMISS_DAYS * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

export function dismissInstallPrompt(): void {
  try {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
  } catch {
    // Storage blocked: it will simply show again next time.
  }
}
