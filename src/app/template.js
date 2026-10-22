"use client";

import { motion, useReducedMotion } from "motion/react";

export default function Template({ children }) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0, transform: reduce ? "none" : "translateY(12px)" }}
      animate={{ opacity: 1, transform: "translateY(0px)" }}
      transition={{ duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
    >
      {children}
    </motion.div>
  );
}
