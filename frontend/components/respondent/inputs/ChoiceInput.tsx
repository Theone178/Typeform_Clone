"use client";

import React, { useEffect, useRef } from "react";
import { Check } from "lucide-react";
import { extractOptionStrings } from "@/lib/questionTypes";

interface ChoiceInputProps {
  options?: (string | { label: string; value: string })[];
  value: any;
  onChange: (val: string) => void;
  onAutoAdvance?: () => void;
  primaryColor?: string;
  textColor?: string;
  readOnly?: boolean;
}

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export const ChoiceInput: React.FC<ChoiceInputProps> = ({
  options = [],
  value,
  onChange,
  onAutoAdvance,
  primaryColor = "#7c3aed",
  textColor = "#191919",
  readOnly = false,
}) => {
  const optionStrings = extractOptionStrings(options);
  const onAutoAdvanceRef = useRef(onAutoAdvance);

  useEffect(() => {
    onAutoAdvanceRef.current = onAutoAdvance;
  }, [onAutoAdvance]);

  const handleSelect = (opt: string) => {
    if (readOnly) return;
    onChange(opt);
    if (onAutoAdvance) {
      setTimeout(() => {
        onAutoAdvanceRef.current?.();
      }, 200);
    }
  };

  useEffect(() => {
    if (readOnly) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in another input or holding modifier
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;

      const key = e.key.toUpperCase();
      const index = LETTERS.indexOf(key);
      if (index >= 0 && index < optionStrings.length) {
        e.preventDefault();
        const selected = optionStrings[index];
        handleSelect(selected);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [optionStrings, readOnly]);

  return (
    <div className="flex flex-col gap-3 w-full max-w-xl">
      {optionStrings.map((opt, idx) => {
        const isSelected = String(value) === opt;
        const letter = LETTERS[idx] || `${idx + 1}`;

        return (
          <button
            key={opt}
            type="button"
            onClick={() => handleSelect(opt)}
            disabled={readOnly}
            className={`group flex items-center justify-between px-4 py-3.5 rounded-xl border-2 text-left transition-all duration-150 ${
              isSelected
                ? "shadow-sm scale-[1.01]"
                : "border-black/10 dark:border-white/10 hover:border-black/25 dark:hover:border-white/25 bg-black/[0.02] dark:bg-white/[0.02]"
            }`}
            style={{
              borderColor: isSelected ? primaryColor : undefined,
              backgroundColor: isSelected ? `${primaryColor}12` : undefined,
              color: textColor,
            }}
          >
            <div className="flex items-center gap-3">
              <span
                className={`w-7 h-7 rounded-md flex items-center justify-center font-mono text-xs font-semibold uppercase transition-colors ${
                  isSelected
                    ? "text-white"
                    : "bg-black/5 dark:bg-white/10 group-hover:bg-black/10 dark:group-hover:bg-white/15"
                }`}
                style={{
                  backgroundColor: isSelected ? primaryColor : undefined,
                }}
              >
                {letter}
              </span>
              <span className="text-base sm:text-lg font-medium">{opt}</span>
            </div>

            {isSelected && (
              <Check className="w-5 h-5 flex-shrink-0" style={{ color: primaryColor }} />
            )}
          </button>
        );
      })}
    </div>
  );
};
