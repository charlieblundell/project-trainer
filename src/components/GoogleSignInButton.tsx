"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
const SCRIPT_SRC = "https://accounts.google.com/gsi/client";

type CredentialResponse = { credential: string };

type GoogleAccountsId = {
  initialize: (config: {
    client_id: string;
    callback: (response: CredentialResponse) => void;
    nonce: string;
    ux_mode: "popup" | "redirect";
  }) => void;
  renderButton: (parent: HTMLElement, options: Record<string, string | number>) => void;
};

declare global {
  interface Window {
    google?: { accounts: { id: GoogleAccountsId } };
  }
}

let scriptLoading: Promise<void> | null = null;

function loadGoogleScript(): Promise<void> {
  if (window.google?.accounts?.id) return Promise.resolve();
  scriptLoading ??= new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      scriptLoading = null;
      reject(new Error("Google sign-in script didn't load."));
    };
    document.head.appendChild(script);
  });
  return scriptLoading;
}

/** Google gets the hash of the nonce; Supabase gets the nonce and checks it against Google's token. */
async function makeNonce(): Promise<{ raw: string; hashed: string }> {
  const raw = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32))));
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(raw));
  const hashed = Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return { raw, hashed };
}

/**
 * Google's own sign-in button. Its sign-in window names this site, where the
 * redirect flow names the Supabase project's address, which looks like a scam.
 * Shows `fallback` (the redirect flow) if Google's script can't load.
 */
export function GoogleSignInButton({ fallback }: { fallback: ReactNode }) {
  const container = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(!CLIENT_ID);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!CLIENT_ID) return;
    let cancelled = false;

    (async () => {
      try {
        const [{ raw, hashed }] = await Promise.all([makeNonce(), loadGoogleScript()]);
        const google = window.google;
        const parent = container.current;
        if (cancelled || !google || !parent) return;

        google.accounts.id.initialize({
          client_id: CLIENT_ID,
          nonce: hashed,
          ux_mode: "popup",
          callback: async ({ credential }) => {
            setError(null);
            const { error } = await supabase.auth.signInWithIdToken({
              provider: "google",
              token: credential,
              nonce: raw,
            });
            if (error) {
              console.error("Google sign-in failed:", error.message);
              setError("Google sign-in didn't work. Try again, or use your email instead.");
            }
            // On success, RedirectIfSignedIn takes them home, or to setup if they're new.
          },
        });

        google.accounts.id.renderButton(parent, {
          type: "standard",
          // The app is light whatever the phone is set to, so the black button
          // Google offers for dark mode would sit oddly on the paper ground.
          theme: "outline",
          size: "large",
          text: "continue_with",
          shape: "rectangular",
          logo_alignment: "center",
          width: Math.max(200, Math.min(400, parent.offsetWidth)),
        });
      } catch (err) {
        console.error(err);
        if (!cancelled) setFailed(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (failed) return <>{fallback}</>;

  return (
    <div>
      <div ref={container} className="flex min-h-[44px] w-full justify-center" />
      {error && <p className="mt-2 text-subhead text-warning">{error}</p>}
    </div>
  );
}
