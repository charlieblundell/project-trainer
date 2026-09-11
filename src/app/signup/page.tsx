"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { Mail } from "lucide-react";
import { TypeMark } from "@/components/TypeMark";
import { RedirectIfSignedIn } from "@/components/RedirectIfSignedIn";
import { marketingFontClasses } from "@/lib/fonts/marketing";
import { supabase } from "@/lib/supabase";
import { isRunningInstalled } from "@/lib/install";

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.95v2.33A9 9 0 0 0 9 18Z"
      />
      <path
        fill="#FBBC05"
        d="M3.97 10.72A5.4 5.4 0 0 1 3.68 9c0-.6.1-1.18.29-1.72V4.95H.95A9 9 0 0 0 0 9c0 1.45.35 2.83.95 4.05l3.02-2.33Z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.51.46 3.44 1.35l2.59-2.59C13.46.89 11.43 0 9 0A9 9 0 0 0 .95 4.95l3.02 2.33C4.68 5.16 6.66 3.58 9 3.58Z"
      />
    </svg>
  );
}

/** Supabase only lets a new code be requested once a minute. */
const RESEND_SECONDS = 60;

const noSubscribe = () => () => {};

export default function SignUp() {
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "verifying">("idle");
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(0);

  // Read without a hydration mismatch: the server always renders "not installed".
  const installed = useSyncExternalStore(noSubscribe, isRunningInstalled, () => false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  async function sendCode() {
    if (!email.trim()) return;
    setStatus("sending");
    setError("");
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      setStatus(code ? "sent" : "idle");
      setError(error.message);
      return;
    }
    setStatus("sent");
    setCooldown(RESEND_SECONDS);
  }

  /**
   * Typing the code signs in right here, in whatever is open — which matters on
   * an iPhone, where a home-screen app doesn't share a sign-in with Safari and
   * an emailed link would open in Safari instead.
   */
  async function verifyCode() {
    const token = code.replace(/\D/g, "");
    if (token.length < 6) return;
    setStatus("verifying");
    setError("");
    const { error } = await supabase.auth.verifyOtp({ email: email.trim(), token, type: "email" });
    if (error) {
      setStatus("sent");
      setError("That code didn't work. Check it's from the most recent email, or send a new one.");
    }
    // On success the sign-in listener picks up the session and
    // RedirectIfSignedIn takes them home, or to setup if they're new.
  }

  async function signInWithGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  const emailButton = (
    <button
      onClick={() => setShowEmailForm(true)}
      className="w-full rounded-md bg-ink py-3.5 text-[15px] font-semibold text-background transition hover:opacity-90"
    >
      Continue with email
    </button>
  );

  const googleButton = (
    <button
      onClick={signInWithGoogle}
      className="flex w-full items-center justify-center gap-2.5 rounded-md border border-line bg-surface py-3.5 text-[15px] font-semibold text-ink transition hover:border-ink"
    >
      <GoogleIcon />
      Continue with Google
    </button>
  );

  return (
    <div className={`${marketingFontClasses} font-marketing-body min-h-screen bg-background`}>
      <div className="mx-auto flex min-h-screen max-w-sm flex-col px-6 py-8">
        <RedirectIfSignedIn />
        <TypeMark />

        <div className="flex flex-1 flex-col justify-center py-12">
          <h1 className="font-marketing-display text-[2.1rem] font-extrabold leading-[1.02] tracking-[-0.01em] text-ink [font-stretch:88%] [text-wrap:balance]">
            {installed ? "Sign in to your plan." : "Start your 10 days free."}
          </h1>
          <p className="mb-8 mt-3 text-[15px] leading-relaxed text-muted">
            {installed
              ? "Use your email and we'll send a code to type in here. You'll only need to do this once on this phone."
              : "No card needed. Answer a few questions and your first week is ready in a couple of minutes."}
          </p>

          {status === "sent" || status === "verifying" ? (
            <div className="flex flex-col gap-2.5">
              <div className="rounded-md border border-line bg-surface p-4">
                <Mail size={20} className="mb-2 text-accent" />
                <div className="mb-1 text-sm font-semibold text-ink">Check your inbox</div>
                <p className="text-sm leading-relaxed text-muted">
                  We sent a code to <span className="text-ink">{email}</span>. Type it below to sign in.
                </p>
              </div>

              <label htmlFor="code" className="mt-2 text-sm font-semibold text-ink">
                Sign-in code
              </label>
              <input
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/[^\d]/g, "").slice(0, 10))}
                onKeyDown={(e) => e.key === "Enter" && verifyCode()}
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="123456"
                autoFocus
                className="tabular w-full rounded-md border border-line bg-surface px-4 py-3.5 text-center text-2xl tracking-[0.3em] focus:border-ink focus:outline-none"
              />
              {error && <p className="text-sm text-warning">{error}</p>}
              <button
                onClick={verifyCode}
                disabled={status === "verifying" || code.length < 6}
                className="w-full rounded-md bg-ink py-3.5 text-[15px] font-semibold text-background transition hover:opacity-90 disabled:opacity-50"
              >
                {status === "verifying" ? "Signing in…" : "Sign in"}
              </button>
              <div className="flex items-center justify-between pt-1 text-sm">
                <button
                  onClick={() => {
                    setStatus("idle");
                    setCode("");
                    setError("");
                  }}
                  className="text-muted hover:text-ink"
                >
                  Use a different email
                </button>
                <button
                  onClick={sendCode}
                  disabled={cooldown > 0}
                  className="font-semibold text-ink disabled:font-normal disabled:text-muted"
                >
                  {cooldown > 0 ? `New code in ${cooldown}s` : "Send a new code"}
                </button>
              </div>
            </div>
          ) : showEmailForm || installed ? (
            <div className="flex flex-col gap-2.5">
              <label htmlFor="email" className="text-sm font-semibold text-ink">
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendCode()}
                placeholder="you@example.com"
                autoComplete="email"
                autoFocus={showEmailForm}
                className="w-full rounded-md border border-line bg-surface px-4 py-3.5 text-[15px] focus:border-ink focus:outline-none"
              />
              {error && <p className="text-sm text-warning">{error}</p>}
              <button
                onClick={sendCode}
                disabled={status === "sending" || !email.trim()}
                className="w-full rounded-md bg-ink py-3.5 text-[15px] font-semibold text-background transition hover:opacity-90 disabled:opacity-50"
              >
                {status === "sending" ? "Sending…" : "Email me a sign-in code"}
              </button>
              {installed ? (
                <div className="mt-3 flex flex-col gap-2">
                  <p className="text-center text-xs text-muted">or</p>
                  {googleButton}
                </div>
              ) : (
                <button onClick={() => setShowEmailForm(false)} className="py-2 text-sm text-muted hover:text-ink">
                  Use Google instead
                </button>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {googleButton}
              {emailButton}
            </div>
          )}

          <p className="mt-6 text-xs leading-relaxed text-muted">
            Already have an account? Use the same email or Google account and you&apos;ll go straight back to your
            plan. You&apos;ll stay signed in on this device.
          </p>
        </div>

        <p className="text-xs leading-relaxed text-muted">
          By continuing, you confirm you&apos;re 16 or older and agree to our{" "}
          <Link href="/terms" className="underline underline-offset-4 hover:text-ink">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="underline underline-offset-4 hover:text-ink">
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
