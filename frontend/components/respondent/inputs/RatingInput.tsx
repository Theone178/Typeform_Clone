"use client";

import React, { useEffect, useRef } from "react";

interface RatingInputProps {
  scale?: number;
  value: any;
  onChange: (val: number) => void;
  onAutoAdvance?: () => void;
  primaryColor?: string;
  textColor?: string;
  readOnly?: boolean;
}

export const RatingInput: React.FC<RatingInputProps> = ({
  scale = 5,
  value,
  onChange,
  onAutoAdvance,
  primaryColor = "#7c3aed",
  textColor = "#191919",
  readOnly = false,
}) => {
  const ratingScale = Math.min(10, Math.max(3, scale || 5));
  const items = Array.from({ length: ratingScale }, (_, i) => i + 1);
  const onAutoAdvanceRef = useRef(onAutoAdvance);

  useEffect(() => {
    onAutoAdvanceRef.current = onAutoAdvance;
  }, [onAutoAdvance]);

  const handleSelect = (num: number) => {
    if (readOnly) return;
    onChange(num);
    if (onAutoAdvance) {
      setTimeout(() => {
        onAutoAdvanceRef.current?.();
      }, 200);
    }
  };

  useEffect(() => {
    if (readOnly) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;

      const num = parseInt(e.key, 10);
      if (!isNaN(num) && num >= 1 && num <= ratingScale) {
        e.preventDefault();
        handleSelect(num);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [ratingScale, readOnly]);

  return (
    <div className="w-full max-w-xl space-y-3">
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        {items.map((num) => {
          const isSelected = Number(value) === num;

          return (
            <button
              key={num}
              type="button"
              onClick={() => handleSelect(num)}
              disabled={readOnly}
              className={`flex-1 min-w-[48px] sm:min-w-[56px] h-14 sm:h-16 rounded-xl border-2 font-bold text-lg sm:text-xl flex flex-col items-center justify-center transition-all duration-150 ${
                isSelected
                  ? "shadow-sm scale-105"
                  : "border-black/10 dark:border-white/10 hover:border-black/25 dark:hover:border-white/25 bg-black/[0.02] dark:bg-white/[0.02]"
              }`}
              style={{
                borderColor: isSelected ? primaryColor : undefined,
                backgroundColor: isSelected ? primaryColor : undefined,
                color: isSelected ? "#ffffff" : textColor,
              }}
            >
              <span>{num}</span>
            </button>
          );
        })}
      </div>

      <div className="flex justify-between text-xs font-medium opacity-50 px-1">
        <span>Not at all</span>
        <span>Extremely</span>
      </div>
    </div>
  );
};
