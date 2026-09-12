"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Home, Dumbbell, CalendarDays, TrendingUp, MessageCircle } from "lucide-react";
import { clsx } from "@/lib/clsx";
import { Wordmark } from "@/components/Wordmark";

/*
 * The functional layer: navigation floating above the content, taking its
 * appearance from whatever scrolls underneath. It carries destinations only —
 * anything that *does* something lives on the screen it acts on.
 */

const ITEMS = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/train", label: "Train", icon: Dumbbell },
  { href: "/plan", label: "Plan", icon: CalendarDays },
  { href: "/progress", label: "Progress", icon: TrendingUp },
  { href: "/coach", label: "Coach", icon: MessageCircle },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <>
      {/* Phone: a floating capsule, inset from the edges, content passing beneath it. */}
      <nav className="pointer-events-none fixed inset-x-0 bottom-0 z-20 flex justify-center pb-[calc(env(safe-area-inset-bottom)+0.5rem)] md:hidden">
        <div className="glass pointer-events-auto mx-3 flex w-full max-w-md rounded-[28px] bg-white/70 px-1 py-1 shadow-[0_6px_24px_rgba(0,0,0,0.14)] ring-1 ring-black/[0.06] backdrop-blur-2xl backdrop-saturate-150">
          {ITEMS.map((item) => {
            const active = pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                // 44pt floor, with the label inside the target rather than below it.
                className="relative flex min-h-[44px] flex-1 flex-col items-center justify-center gap-[3px] rounded-[24px] py-1.5"
              >
                <motion.div whileTap={{ scale: 0.88 }} transition={{ duration: 0.12 }}>
                  <Icon
                    size={22}
                    strokeWidth={active ? 2.3 : 1.9}
                    className={active ? "text-accent" : "text-ink-soft"}
                  />
                </motion.div>
                <span
                  className={clsx(
                    "text-[11px] leading-none",
                    active ? "font-semibold text-accent" : "font-medium text-ink-soft"
                  )}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Desktop: a sidebar, since a floating capsule is a phone idea. */}
      <nav className="fixed inset-y-0 left-0 z-20 hidden w-60 flex-col border-r border-line bg-surface px-3 py-8 md:flex">
        <Wordmark className="mb-8 px-3" />
        <div className="flex flex-col gap-0.5">
          {ITEMS.map((item) => {
            const active = pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined} className="relative">
                {active && (
                  <motion.div
                    layoutId="desktop-nav-highlight"
                    className="absolute inset-0 rounded-[10px] bg-accent-soft"
                    transition={{ type: "spring", stiffness: 500, damping: 35 }}
                  />
                )}
                <div
                  className={clsx(
                    "relative flex min-h-[44px] items-center gap-3 rounded-[10px] px-3 text-body font-medium transition-colors",
                    active ? "text-accent" : "text-muted hover:text-ink"
                  )}
                >
                  <Icon size={20} strokeWidth={active ? 2.3 : 1.9} />
                  {item.label}
                </div>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
