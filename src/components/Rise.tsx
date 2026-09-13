"use client";

import { animate, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

/**
 * A block that eases up into place, `order` steps after the first. Screens
 * made of cards use it so they settle in one after another rather than all
 * landing at once.
 */
export function Rise({
  order = 0,
  className,
  children,
}: {
  order?: number;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 28, delay: order * 0.06 }}
    >
      {children}
    </motion.div>
  );
}

/** Counts from 0 up to `value` once, so a number arrives rather than appears. */
export function useCountUp(value: number, duration = 0.8): number {
  const reduce = useReducedMotion();
  const [shown, setShown] = useState(0);

  useEffect(() => {
    if (reduce) return;
    const controls = animate(0, value, {
      duration,
      ease: "easeOut",
      onUpdate: (v) => setShown(Math.round(v)),
    });
    return () => controls.stop();
  }, [value, duration, reduce]);

  return reduce ? value : shown;
}
