"use client";

import Link from "next/link";
import { BookOpen, ChevronRight } from "lucide-react";
import { rulesFor } from "@/lib/plan/rules";
import type { Plan } from "@/lib/plan/types";

/*
 * The way into "how your plan is built", looking the same wherever it
 * appears — the plan's reveal, the top of the Plan tab — so it becomes a
 * recognisable part of the app rather than a link someone has to find.
 *
 * The counts are this plan's own: the rules that apply to them, split the
 * same honest way the screen splits them.
 */
export function BuiltOnResearch({ plan, className = "" }: { plan: Plan; className?: string }) {
  const rules = rulesFor({ plan, goal: plan.goal, level: plan.level });
  const research = rules.filter((r) => r.basis.kind === "research").length;
  const ours = rules.length - research;

  return (
    <Link
      href="/plan/why"
      className={`flex min-h-[64px] items-center gap-3.5 rounded-[20px] bg-surface shadow-card p-4 active:bg-fill ${className}`}
    >
      <span
        aria-hidden
        className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[11px] bg-accent text-white"
      >
        <BookOpen size={21} strokeWidth={2.2} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-headline font-semibold text-ink">Built on research</span>
        <span className="block text-subhead text-muted">
          {research} from research · {ours} our call
        </span>
      </span>
      <ChevronRight size={18} strokeWidth={2.2} className="flex-shrink-0 text-faint" aria-hidden />
    </Link>
  );
}
