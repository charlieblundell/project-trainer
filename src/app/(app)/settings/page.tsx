"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { useAuthStore } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { EQUIPMENT_LABELS, EXERCISES_BY_ID, type Equipment } from "@/lib/exercises";
import type { OnboardingData } from "@/lib/types";

const DAY_LABELS: Record<string, string> = {
  mon: "Mon",
  tue: "Tue",
  wed: "Wed",
  thu: "Thu",
  fri: "Fri",
  sat: "Sat",
  sun: "Sun",
};

const SEX_LABELS: Record<string, string> = {
  male: "Male",
  female: "Female",
  prefer_not_to_say: "Not specified",
};

function exerciseNames(ids: string[]): string {
  return ids.map((id) => EXERCISES_BY_ID[id]?.name ?? id).join(", ");
}

function profileRows(o: OnboardingData): [string, string][] {
  const rows: [string, string][] = [
    ["Goal", o.goal ?? "Not set"],
    ["Experience", o.experience ?? "Not set"],
    ["Sessions", o.days ? `${o.days}/week` : "Not set"],
    ["Session length", o.length ? `~${o.length} min` : "Not set"],
    ["Where you train", o.environment ?? "Not set"],
  ];

  if (o.trainingDays.length) {
    rows.push(["Days", o.trainingDays.map((d) => DAY_LABELS[d] ?? d).join(", ")]);
  }
  if (o.equipment.length) {
    rows.push(["Equipment", o.equipment.map((e) => EQUIPMENT_LABELS[e as Equipment] ?? e).join(", ")]);
  }
  if (o.likedExercises.length) {
    rows.push(["Favourites", exerciseNames(o.likedExercises)]);
  }
  if (o.dislikedExercises.length) {
    rows.push(["Avoiding", exerciseNames(o.dislikedExercises)]);
  }
  if (o.bodyweightKg) rows.push(["Bodyweight", `${o.bodyweightKg} kg`]);
  if (o.age) rows.push(["Age", `${o.age}`]);
  if (o.heightCm) rows.push(["Height", `${o.heightCm} cm`]);
  if (o.sex) rows.push(["Sex", SEX_LABELS[o.sex] ?? o.sex]);
  if (o.considerations) rows.push(["Notes", o.considerations]);

  return rows;
}

export default function Settings() {
  const router = useRouter();
  const onboarding = useAppStore((s) => s.onboarding);
  const user = useAuthStore((s) => s.user);

  async function logOut() {
    await supabase.auth.signOut();
    router.push("/");
  }

  return (
    <div className="mx-auto max-w-sm">
      <button onClick={() => router.push("/home")} className="mb-4 flex items-center text-muted">
        <ChevronLeft size={18} />
      </button>
      <h1 className="mb-1 font-display text-2xl font-bold text-ink">Settings</h1>
      {user?.email && <p className="mb-5 text-sm text-muted">{user.email}</p>}

      <div className="mb-2 text-xs font-semibold tracking-widest text-muted">YOUR PROFILE</div>
      <div className="mb-6 overflow-hidden rounded-2xl border border-line bg-surface">
        {profileRows(onboarding).map(([label, value], i) => (
          <div
            key={label}
            className={`flex justify-between gap-6 px-4 py-3.5 text-sm ${i !== 0 ? "border-t border-line" : ""}`}
          >
            <span className="flex-shrink-0 text-muted">{label}</span>
            <span className="text-right font-semibold text-ink">{value}</span>
          </div>
        ))}
      </div>

      <div className="mb-2 text-xs font-semibold tracking-widest text-muted">PLAN</div>
      <div className="mb-6 flex items-center justify-between rounded-2xl border border-line bg-surface px-4 py-3.5">
        <div>
          <div className="text-sm font-semibold text-ink">Free</div>
          <div className="text-xs text-muted">1 program · limited coach messages</div>
        </div>
        <button className="rounded-xl bg-ink px-3.5 py-2 text-xs font-semibold text-background">
          Upgrade
        </button>
      </div>

      <button
        onClick={logOut}
        className="w-full rounded-2xl border border-line py-3.5 text-sm font-semibold text-warning"
      >
        Log out
      </button>
    </div>
  );
}
