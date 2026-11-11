"use client";

import React from "react";
import { motion } from "framer-motion";

interface ProgressBarProps {
  progress: number; // 0 to 100
  primaryColor?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  primaryColor = "#7c3aed",
}) => {
  return (
    <div className="fixed top-0 left-0 right-0 h-1.5 bg-black/5 dark:bg-white/10 z-50">
      <motion.div
        className="h-full rounded-r-full"
        style={{ backgroundColor: primaryColor }}
        initial={{ width: "0%" }}
        animate={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        transition={{ duration: 0.35, ease: "easeOut" }}
      />
    </div>
  );
};
