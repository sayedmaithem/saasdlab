"use client";

import React from "react";
import { motion } from "framer-motion";
import { Sparkles, Loader2 } from "lucide-react";

interface AIScanButtonProps {
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  isLoading?: boolean;
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
  type?: "button" | "submit" | "reset";
}

export function AIScanButton({
  onClick,
  isLoading = false,
  className = "",
  disabled = false,
  type = "button",
  children,
}: AIScanButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      disabled={isLoading || disabled}
      type={type}
      className={`relative overflow-hidden glass-strong bg-gradient-primary glow-primary text-white px-6 py-3 rounded-xl flex items-center justify-center gap-2 font-semibold tracking-wide shadow-lg transition-all disabled:opacity-70 disabled:cursor-not-allowed ${className}`}
    >
      {/* Subtle hover overlay */}
      <div className="absolute inset-0 bg-white/10 opacity-0 hover:opacity-100 transition-opacity duration-300 rounded-xl" />
      
      {/* Pulse effect while loading */}
      {isLoading && (
        <motion.div 
          className="absolute inset-0 bg-white/20 rounded-xl z-0"
          animate={{ opacity: [0, 0.6, 0] }}
          transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
        />
      )}

      {/* Icon */}
      <div className="relative z-10">
        {isLoading ? (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          >
            <Loader2 className="w-5 h-5" />
          </motion.div>
        ) : (
          <motion.div
            animate={{ 
              scale: [1, 1.15, 1],
              rotate: [0, 5, -5, 0]
            }}
            transition={{ 
              repeat: Infinity, 
              duration: 3,
              ease: "easeInOut",
              repeatDelay: 1
            }}
          >
            <Sparkles className="w-5 h-5 text-white/90" />
          </motion.div>
        )}
      </div>
      
      {/* Text */}
      <span className="relative z-10">{children || "AI Scan Case"}</span>
    </motion.button>
  );
}
