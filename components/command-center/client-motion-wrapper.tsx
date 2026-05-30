"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

export function ClientMotionWrapper({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: 0.1,
            delayChildren: 0.05,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function MotionSection({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.section
      variants={{
        hidden: { opacity: 0, y: 30, filter: "blur(4px)" },
        visible: { 
          opacity: 1, 
          y: 0, 
          filter: "blur(0px)",
          transition: { type: "spring", stiffness: 80, damping: 15 } 
        },
      }}
      className={className}
    >
      {children}
    </motion.section>
  );
}
