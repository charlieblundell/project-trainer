"use client";

import { MotionConfig, motion } from "framer-motion";

/*
 * reducedMotion="user" makes every framer animation in the app follow the
 * phone's Reduce Motion setting: movement is dropped, fades stay. The CSS
 * media query in globals.css only reaches CSS transitions, not these.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </motion.div>
    </MotionConfig>
  );
}
