"use client";

import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, ExternalLink } from "lucide-react";
import confetti from "canvas-confetti";
import { ThankYouConfig } from "@/lib/types";

interface ThankYouScreenProps {
  thankYou?: ThankYouConfig;
  primaryColor?: string;
  textColor?: string;
}

export const ThankYouScreen: React.FC<ThankYouScreenProps> = ({
  thankYou,
  primaryColor = "#7c3aed",
  textColor = "#191919",
}) => {
  useEffect(() => {
    // Fire celebratory confetti on mount
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: [primaryColor, "#10b981", "#3b82f6", "#f59e0b"],
      });
    } catch {
      // safe fallback if canvas-confetti has issues
    }
  }, [primaryColor]);

  const title = thankYou?.title || "Thank you!";
  const message = thankYou?.message || "Your response has been recorded.";
  const buttonText = thankYou?.button_text;
  const buttonUrl = thankYou?.button_url;

  return (
    <div className="flex flex-col items-start justify-center max-w-2xl w-full mx-auto px-6 py-12">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full space-y-6"
      >
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-md"
          style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}
        >
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <h1
          className="text-4xl sm:text-5xl font-bold tracking-tight leading-tight"
          style={{ color: textColor }}
        >
          {title}
        </h1>

        <p className="text-lg sm:text-xl opacity-75 font-normal leading-relaxed">
          {message}
        </p>

        {buttonText && buttonUrl && (
          <div className="pt-4">
            <a
              href={buttonUrl}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white shadow-md hover:opacity-95 active:scale-[0.98] transition-all text-base"
              style={{ backgroundColor: primaryColor }}
            >
              <span>{buttonText}</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        )}
      </motion.div>
    </div>
  );
};
