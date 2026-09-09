"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Home, Dumbbell, CalendarDays, TrendingUp, MessageCircle } from "lucide-react";
import { clsx } from "@/lib/clsx";

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
      {/* Mobile bottom bar */}
      <nav className="fixed inset-x-0 bottom-0 z-20 flex border-t border-line bg-surface/95 backdrop-blur px-2 pb-[env(safe-area-inset-bottom)] md:hidden">
        {ITEMS.map((item) => {
          const active = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex flex-1 flex-col items-center gap-1 py-2.5"
            >
              {active && (
                <motion.div
                  layoutId="mobile-nav-dot"
                  className="absolute top-1 h-1 w-1 rounded-full bg-accent"
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                />
              )}
              <motion.div whileTap={{ scale: 0.85 }}>
                <Icon size={20} strokeWidth={active ? 2.4 : 2} className={active ? "text-ink" : "text-muted"} />
              </motion.div>
              <span className={clsx("text-[10px]", active ? "font-semibold text-ink" : "text-muted")}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Desktop left rail */}
      <nav className="fixed inset-y-0 left-0 z-20 hidden w-60 flex-col border-r border-line bg-surface px-4 py-8 md:flex">
        <div className="mb-10 px-2 font-display text-lg font-bold tracking-tight">Project Trainer</div>
        <div className="flex flex-col gap-1">
          {ITEMS.map((item) => {
            const active = pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} className="relative">
                {active && (
                  <motion.div
                    layoutId="desktop-nav-highlight"
                    className="absolute inset-0 rounded-xl bg-accent-soft"
                    transition={{ type: "spring", stiffness: 500, damping: 35 }}
                  />
                )}
                <div
                  className={clsx(
                    "relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                    active ? "text-accent" : "text-muted hover:text-ink"
                  )}
                >
                  <Icon size={18} strokeWidth={active ? 2.4 : 2} />
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
