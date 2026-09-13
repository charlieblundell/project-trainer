"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Check } from "lucide-react";

/** A small burst around the badge: finishing a session deserves a moment. */
const SPARKS = Array.from({ length: 14 }, (_, i) => {
  const angle = (i / 14) * Math.PI * 2;
  const distance = 70 + (i % 3) * 18;
  return {
    x: Math.cos(angle) * distance,
    y: Math.sin(angle) * distance,
    color: ["#0068e0", "#34c759", "#ff9f0a", "#af52de"][i % 4],
    size: 6 + (i % 2) * 3,
  };
});

/** The finished-workout check: springs in, throws a burst, in the session's colour. */
export function FinishBadge({ background }: { background: React.CSSProperties }) {
  const reduceMotion = useReducedMotion();
  return (
    <div className="relative mb-5 flex h-24 w-24 items-center justify-center">
      {!reduceMotion &&
        SPARKS.map((spark, i) => (
          <motion.span
            key={i}
            aria-hidden
            className="absolute rounded-full"
            style={{ width: spark.size, height: spark.size, backgroundColor: spark.color }}
            initial={{ x: 0, y: 0, opacity: 0, scale: 0.4 }}
            animate={{ x: spark.x, y: spark.y, opacity: [0, 1, 0], scale: [0.4, 1, 0.6] }}
            transition={{ duration: 0.9, delay: 0.15, ease: "easeOut" }}
          />
        ))}
      <motion.div
        initial={reduceMotion ? false : { scale: 0.3, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 380, damping: 16 }}
        className="flex h-24 w-24 items-center justify-center rounded-full text-white shadow-[0_14px_30px_-12px_rgba(0,0,0,0.4)]"
        style={background}
      >
        <Check size={48} strokeWidth={3} aria-hidden />
      </motion.div>
    </div>
  );
}
