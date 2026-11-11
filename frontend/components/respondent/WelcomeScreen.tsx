"use client";

import React from "react";
import { motion } from "framer-motion";
import { ArrowRight, Clock, HelpCircle } from "lucide-react";
import { PublicForm } from "@/lib/types";

interface WelcomeScreenProps {
  form: PublicForm;
  onStart: () => void;
  primaryColor?: string;
  textColor?: string;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  form,
  onStart,
  primaryColor = "#7c3aed",
  textColor = "#191919",
}) => {
  const estimatedMinutes = Math.max(1, Math.ceil(form.questions.length * 0.4));

  return (
    <div className="flex flex-col items-start justify-center max-w-2xl w-full mx-auto px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full space-y-6"
      >
        <div className="flex items-center gap-4 text-sm font-medium opacity-60">
          <span className="flex items-center gap-1.5">
            <HelpCircle className="w-4 h-4" />
            {form.questions.length} {form.questions.length === 1 ? "question" : "questions"}
          </span>
          <span>•</span>
          <span className="flex items-center gap-1.5">
            <Clock className="w-4 h-4" />
            Takes ~{estimatedMinutes} min
          </span>
        </div>

        <h1
          className="text-4xl sm:text-5xl font-bold tracking-tight leading-tight"
          style={{ color: textColor }}
        >
          {form.title}
        </h1>

        <p className="text-lg sm:text-xl opacity-75 font-normal leading-relaxed">
          Welcome! Please answer each question carefully. You can navigate using your keyboard or on-screen buttons.
        </p>

        <div className="pt-4 flex flex-wrap items-center gap-4">
          <button
            type="button"
            onClick={onStart}
            className="group inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-white shadow-lg shadow-purple-500/20 hover:opacity-95 active:scale-[0.98] transition-all text-lg"
            style={{ backgroundColor: primaryColor }}
          >
            <span>Start</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>

          <span className="text-xs uppercase tracking-wider font-semibold opacity-50 flex items-center gap-1">
            press <kbd className="px-2 py-1 rounded bg-black/5 dark:bg-white/10 font-mono text-xs">Enter ↵</kbd>
          </span>
        </div>
      </motion.div>
    </div>
  );
};
