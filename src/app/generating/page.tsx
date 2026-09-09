"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { GENERATING_STEPS } from "@/lib/data";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/Button";
import { LogoMark } from "@/components/Wordmark";
import { supabase } from "@/lib/supabase";

export default function Generating() {
  const router = useRouter();
  const onboarding = useAppStore((s) => s.onboarding);
  const completeOnboarding = useAppStore((s) => s.completeOnboarding);
  const [genStep, setGenStep] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setGenStep((s) => {
        if (s >= GENERATING_STEPS.length) {
          clearInterval(id);
          return s;
        }
        return s + 1;
      });
    }, 550);
    return () => clearInterval(id);
  }, []);

  const ready = genStep >= GENERATING_STEPS.length;

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6 py-10">
      {!ready ? (
        <>
          <div className="relative mx-auto mb-10 flex h-20 w-20 items-center justify-center">
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{ border: "2px solid var(--accent-soft)" }}
            />
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{ border: "2px solid transparent", borderTopColor: "var(--accent)" }}
              animate={{ rotate: 360 }}
              transition={{ duration: 1.1, repeat: Infinity, ease: "linear" }}
            />
            <LogoMark size={40} />
          </div>
          <h1 className="mb-8 text-center font-display text-2xl font-bold text-ink">
            Building your plan.
          </h1>
          <div className="flex flex-col gap-4">
            {GENERATING_STEPS.map((label, i) => (
              <div key={label} className="flex items-center gap-3" style={{ opacity: i <= genStep ? 1 : 0.35 }}>
                <div
                  className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border"
                  style={{
                    borderColor: i < genStep ? "var(--success)" : "var(--line)",
                    background: i < genStep ? "var(--success)" : "transparent",
                  }}
                >
                  {i < genStep && <Check size={12} className="text-white" />}
                </div>
                <span className={`text-sm ${i < genStep ? "text-ink" : "text-muted"}`}>
                  {label}
                  {i === genStep ? "..." : ""}
                </span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="mb-5 font-display text-2xl font-bold text-ink">Your plan is ready.</h1>
          <div className="mb-6 rounded-2xl border border-line bg-surface p-5">
            {[
              ["Duration", "8 weeks"],
              ["Training days", `${onboarding.days ?? 4}/week`],
              ["Session length", `~${onboarding.length ?? 60} min`],
              ["Goal", onboarding.goal ?? "Build muscle"],
              ["Where", onboarding.environment ?? "Full gym"],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between border-t border-line py-2 text-sm first:border-t-0">
                <span className="text-muted">{k}</span>
                <span className="font-semibold text-ink">{v}</span>
              </div>
            ))}
          </div>
          <Button
            onClick={async () => {
              const { data } = await supabase.auth.getUser();
              if (data.user) {
                await supabase
                  .from("profiles")
                  .update({
                    goal: onboarding.goal,
                    experience: onboarding.experience,
                    days: onboarding.days,
                    length: onboarding.length,
                    environment: onboarding.environment,
                  })
                  .eq("id", data.user.id);
              }
              completeOnboarding();
              router.push("/home");
            }}
          >
            View my plan
          </Button>
        </motion.div>
      )}
    </div>
  );
}
