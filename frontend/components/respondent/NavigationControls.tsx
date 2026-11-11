"use client";

import React from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface NavigationControlsProps {
  onPrev: () => void;
  onNext: () => void;
  canPrev: boolean;
  canNext: boolean;
  primaryColor?: string;
  textColor?: string;
}

export const NavigationControls: React.FC<NavigationControlsProps> = ({
  onPrev,
  onNext,
  canPrev,
  canNext,
  primaryColor = "#7c3aed",
  textColor = "#191919",
}) => {
  return (
    <div className="fixed bottom-6 right-6 z-40 flex items-center gap-1.5 bg-black/10 dark:bg-white/10 backdrop-blur-md p-1.5 rounded-xl border border-black/5 dark:border-white/10 shadow-sm">
      <button
        type="button"
        onClick={onPrev}
        disabled={!canPrev}
        aria-label="Previous question"
        className="p-2 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:bg-black/10 dark:hover:bg-white/15"
        style={{ color: textColor }}
      >
        <ChevronUp className="w-5 h-5" />
      </button>

      <button
        type="button"
        onClick={onNext}
        disabled={!canNext}
        aria-label="Next question"
        className="p-2 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:bg-black/10 dark:hover:bg-white/15"
        style={{ color: textColor }}
      >
        <ChevronDown className="w-5 h-5" />
      </button>
    </div>
  );
};
