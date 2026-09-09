"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { LogoMark } from "@/components/Wordmark";

export default function SignUp() {
  const router = useRouter();

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6 py-10">
      <Link href="/" className="mb-8 w-fit text-muted">
        <ChevronLeft size={20} />
      </Link>

      <LogoMark size={36} />
      <h1 className="mb-8 mt-4 font-display text-3xl font-bold text-ink">Start training smarter.</h1>

      <div className="mb-5 flex flex-col gap-2.5">
        {["Continue with Google", "Continue with Apple"].map((label) => (
          <button
            key={label}
            onClick={() => router.push("/onboarding")}
            className="w-full rounded-2xl border border-line bg-surface py-3.5 text-sm font-semibold text-ink transition hover:border-ink/30 active:scale-[0.98]"
          >
            {label}
          </button>
        ))}
        <button
          onClick={() => router.push("/onboarding")}
          className="w-full rounded-2xl bg-ink py-3.5 text-sm font-semibold text-background transition active:scale-[0.98]"
        >
          Continue with Email
        </button>
      </div>

      <p className="text-center text-xs leading-relaxed text-muted">
        By continuing, you agree to our Terms and Privacy Policy.
      </p>
    </div>
  );
}
