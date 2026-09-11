"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail } from "lucide-react";
import { TypeMark } from "@/components/TypeMark";
import { RedirectIfSignedIn } from "@/components/RedirectIfSignedIn";
import { marketingFontClasses } from "@/lib/fonts/marketing";
import { supabase } from "@/lib/supabase";

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

export default function SignUp() {
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  async function sendMagicLink() {
    if (!email.trim()) return;
    setStatus("sending");
    setError("");
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      setStatus("error");
      setError(error.message);
    } else {
      setStatus("sent");
    }
  }

  async function signInWithGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  return (
    <div className={`${marketingFontClasses} font-marketing-body min-h-screen bg-background`}>
      <div className="mx-auto flex min-h-screen max-w-sm flex-col px-6 py-8">
        <RedirectIfSignedIn to="/home" />
        <TypeMark />

        <div className="flex flex-1 flex-col justify-center py-12">
          <h1 className="font-marketing-display text-[2.1rem] font-extrabold leading-[1.02] tracking-[-0.01em] text-ink [font-stretch:88%] [text-wrap:balance]">
            Start your 10 days free.
          </h1>
          <p className="mb-8 mt-3 text-[15px] leading-relaxed text-muted">
            No card needed. Answer a few questions and your first week is ready in a couple of
            minutes.
          </p>

          {status === "sent" ? (
            <div className="rounded-md border border-line bg-surface p-5">
              <Mail size={20} className="mb-3 text-accent" />
              <div className="mb-1 text-sm font-semibold text-ink">Check your inbox</div>
              <p className="text-sm leading-relaxed text-muted">
                We sent a sign-in link to <span className="text-ink">{email}</span>. Open it on this
                device to carry on.
              </p>
            </div>
          ) : showEmailForm ? (
            <div className="flex flex-col gap-2.5">
              <label htmlFor="email" className="text-sm font-semibold text-ink">
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMagicLink()}
                placeholder="you@example.com"
                autoFocus
                className="w-full rounded-md border border-line bg-surface px-4 py-3.5 text-[15px] focus:border-ink focus:outline-none"
              />
              {status === "error" && <p className="text-sm text-warning">{error}</p>}
              <button
                onClick={sendMagicLink}
                disabled={status === "sending" || !email.trim()}
                className="w-full rounded-md bg-ink py-3.5 text-[15px] font-semibold text-background transition hover:opacity-90 disabled:opacity-50"
              >
                {status === "sending" ? "Sending…" : "Email me a sign-in link"}
              </button>
              <button
                onClick={() => setShowEmailForm(false)}
                className="py-2 text-sm text-muted hover:text-ink"
              >
                Use Google instead
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              <button
                onClick={signInWithGoogle}
                className="flex w-full items-center justify-center gap-2.5 rounded-md border border-line bg-surface py-3.5 text-[15px] font-semibold text-ink transition hover:border-ink"
              >
                <GoogleIcon />
                Continue with Google
              </button>
              <button
                onClick={() => setShowEmailForm(true)}
                className="w-full rounded-md bg-ink py-3.5 text-[15px] font-semibold text-background transition hover:opacity-90"
              >
                Continue with email
              </button>
            </div>
          )}

          <p className="mt-6 text-xs leading-relaxed text-muted">
            Already have an account? Use the same option you signed up with and you&apos;ll go
            straight back to your plan.
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
