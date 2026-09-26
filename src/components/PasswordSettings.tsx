"use client";

import { useState } from "react";
import { isAuthApiError } from "@supabase/supabase-js";
import { useAuthStore } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export const MIN_PASSWORD_LENGTH = 8;

/**
 * Sets the signed-in account's password, so another device can sign in with
 * an email and password rather than waiting on an emailed code.
 *
 * Supabase doesn't say whether an account has a password, so saving one also
 * records it in the user's metadata; that's what sign-up and Settings check.
 */
export function PasswordForm({
  email,
  submitLabel,
  onSaved,
  onCancel,
}: {
  email: string;
  submitLabel: string;
  onSaved: () => void;
  /** Left out where a password isn't optional. */
  onCancel?: () => void;
}) {
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  // Only asked for when Supabase wants proof it's them before a change.
  const [needsCode, setNeedsCode] = useState(false);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tooShort = password.length < MIN_PASSWORD_LENGTH;

  async function save() {
    if (tooShort || busy) return;
    setBusy(true);
    setError(null);
    const nonce = needsCode ? code.replace(/\D/g, "") : undefined;
    try {
      const { error } = await supabase.auth.updateUser({
        password,
        data: { has_password: true },
        ...(nonce ? { nonce } : {}),
      });
      if (!error) {
        onSaved();
      } else if (isAuthApiError(error) && error.code === "reauthentication_needed") {
        const { error: sendError } = await supabase.auth.reauthenticate();
        setNeedsCode(true);
        setError(sendError ? "We couldn't send a code. Try again in a minute." : null);
      } else if (isAuthApiError(error) && error.code === "same_password") {
        onSaved();
      } else if (isAuthApiError(error) && error.code === "weak_password") {
        setError("That password is too easy to guess. Try a longer one, or add numbers and symbols.");
      } else if (needsCode) {
        setError("That code didn't work. Check it's from the most recent email.");
      } else {
        setError("That didn't save. Check your connection and try again.");
      }
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
    }
    setBusy(false);
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void save();
      }}
    >
      {/* Lets a password manager save the email alongside the new password. */}
      <input type="email" name="email" autoComplete="username" value={email} readOnly hidden />

      <label htmlFor="new-password" className="mb-1.5 block text-footnote text-muted">
        Password (at least {MIN_PASSWORD_LENGTH} characters)
      </label>
      <div className="mb-3 flex items-center gap-2 rounded-[12px] border border-line bg-background pr-2 focus-within:border-ink">
        <input
          id="new-password"
          type={show ? "text" : "password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          autoFocus
          disabled={needsCode}
          className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-subhead focus:outline-none"
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="min-h-[36px] px-1 text-footnote font-semibold text-accent"
        >
          {show ? "Hide" : "Show"}
        </button>
      </div>

      {needsCode && (
        <>
          <p className="mb-2 text-footnote leading-relaxed text-ink">
            To keep your account safe, we&apos;ve emailed a code to {email}. Type it here to save your password.
          </p>
          <label htmlFor="password-code" className="mb-1.5 block text-footnote text-muted">
            Code from the email
          </label>
          <input
            id="password-code"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/[^\d]/g, "").slice(0, 10))}
            inputMode="numeric"
            autoComplete="one-time-code"
            autoFocus
            className="tabular mb-3 w-full rounded-[12px] border border-line bg-background px-3 py-2.5 text-subhead"
          />
        </>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={tooShort || busy || (needsCode && code.length < 6)}
          className="flex-1 min-h-[48px] rounded-[12px] bg-accent text-body font-semibold text-accent-ink disabled:opacity-50"
        >
          {busy ? "Saving" : submitLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="flex-1 min-h-[48px] rounded-[12px] border border-line text-subhead font-semibold text-ink"
          >
            Cancel
          </button>
        )}
      </div>

      {error && <p className="mt-2 text-footnote text-warning">{error}</p>}
    </form>
  );
}

/** Settings' password card: set one if sign-up didn't, or change it. */
export function PasswordSettings() {
  const user = useAuthStore((s) => s.user);
  const hasPassword = user?.user_metadata?.has_password === true;
  const [open, setOpen] = useState(false);
  const [saved, setSaved] = useState(false);

  if (!user?.email) return null;

  return (
    <>
      <div className="mb-2 text-footnote font-semibold text-muted">Password</div>
      <div className="mb-6 rounded-[20px] bg-surface shadow-card px-4 py-3.5">
        <div className="text-subhead font-semibold text-ink">{hasPassword ? "Password set" : "No password yet"}</div>
        <div className="text-footnote leading-relaxed text-muted">
          {saved
            ? "Saved. On another device, sign in with your email and this password."
            : hasPassword
              ? "Sign in on any device with your email and password. You can still use an emailed code."
              : "Add one to sign in on another device with just your email and password, no code needed."}
        </div>

        {!open ? (
          <button
            onClick={() => {
              setOpen(true);
              setSaved(false);
            }}
            className="mt-3 w-full min-h-[48px] rounded-[12px] border border-line text-subhead font-semibold text-ink"
          >
            {hasPassword ? "Change password" : "Set a password"}
          </button>
        ) : (
          <div className="mt-3">
            <PasswordForm
              email={user.email}
              submitLabel="Save password"
              onSaved={() => {
                setOpen(false);
                setSaved(true);
              }}
              onCancel={() => setOpen(false)}
            />
          </div>
        )}
      </div>
    </>
  );
}
