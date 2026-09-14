"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CloudOff, RefreshCw } from "lucide-react";
import { useOnline } from "@/lib/offline/network";
import { useOutbox } from "@/lib/offline/outbox";

/**
 * A small pill above the tab bar while there's no connection, or while saves
 * made without one are still waiting to go. It says what still works, so
 * nobody stops mid-workout wondering whether their sets count.
 */
export function OfflinePill() {
  const online = useOnline();
  const pending = useOutbox((s) => s.pending);
  const show = !online || pending > 0;

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+5.25rem)] z-30 flex justify-center md:bottom-6 md:left-60"
    >
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 420, damping: 32 }}
            className="flex items-center gap-1.5 rounded-full bg-[#2c2a27] px-3.5 py-2 text-footnote font-semibold text-white shadow-[0_8px_20px_-8px_rgba(0,0,0,0.5)]"
          >
            {online ? (
              <>
                <RefreshCw size={14} className="animate-spin" aria-hidden />
                Syncing {pending} saved {pending === 1 ? "change" : "changes"}
              </>
            ) : (
              <>
                <CloudOff size={14} aria-hidden />
                {pending > 0
                  ? `Offline · ${pending} ${pending === 1 ? "save" : "saves"} waiting on this phone`
                  : "Offline · workouts still save on this phone"}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
