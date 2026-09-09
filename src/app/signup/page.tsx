"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, Mail } from "lucide-react";
import { LogoMark } from "@/components/Wordmark";
import { supabase } from "@/lib/supabase";

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18">
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
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6 py-10">
      <Link href="/" className="mb-8 w-fit text-muted">
        <ChevronLeft size={20} />
      </Link>

      <LogoMark size={36} />
      <h1 className="mb-8 mt-4 font-display text-3xl font-bold text-ink">Start training smarter.</h1>

      {status === "sent" ? (
        <div className="rounded-2xl border border-line bg-surface p-5 text-center">
          <Mail size={24} className="mx-auto mb-3 text-accent" />
          <div className="mb-1 text-sm font-semibold text-ink">Check your inbox</div>
          <p className="text-sm leading-relaxed text-muted">
            We sent a sign-in link to <span className="text-ink">{email}</span>. Open it on this
            device to continue.
          </p>
        </div>
      ) : showEmailForm ? (
        <div className="flex flex-col gap-2.5">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMagicLink()}
            placeholder="you@example.com"
            autoFocus
            className="w-full rounded-2xl border border-line px-4 py-3.5 text-sm"
          />
          {status === "error" && <p className="text-xs text-warning">{error}</p>}
          <button
            onClick={sendMagicLink}
            disabled={status === "sending" || !email.trim()}
            className="w-full rounded-2xl bg-ink py-3.5 text-sm font-semibold text-background transition active:scale-[0.98] disabled:opacity-50"
          >
            {status === "sending" ? "Sending..." : "Send sign-in link"}
          </button>
        </div>
      ) : (
        <div className="mb-5 flex flex-col gap-2.5">
          <button
            onClick={signInWithGoogle}
            className="flex w-full items-center justify-center gap-2.5 rounded-2xl border border-line bg-surface py-3.5 text-sm font-semibold text-ink transition hover:border-ink/30 active:scale-[0.98]"
          >
            <GoogleIcon />
            Continue with Google
          </button>
          <button
            disabled
            title="Not set up yet"
            className="w-full cursor-not-allowed rounded-2xl border border-line bg-surface py-3.5 text-sm font-semibold text-muted opacity-50"
          >
            Continue with Apple
          </button>
          <button
            onClick={() => setShowEmailForm(true)}
            className="w-full rounded-2xl bg-ink py-3.5 text-sm font-semibold text-background transition active:scale-[0.98]"
          >
            Continue with Email
          </button>
        </div>
      )}

      <p className="mt-5 text-center text-xs leading-relaxed text-muted">
        By continuing, you agree to our Terms and Privacy Policy.
      </p>
    </div>
  );
}
