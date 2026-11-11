"use client";

import React, { useRef } from "react";
import { ThumbsUp, ThumbsDown } from "lucide-react";

interface YesNoInputProps {
  value: string | null | undefined;
  onChange: (value: string) => void;
  onAutoAdvance: () => void;
  primaryColor?: string;
  textColor?: string;
  readOnly?: boolean;
}

export const YesNoInput: React.FC<YesNoInputProps> = ({
  value,
  onChange,
  onAutoAdvance,
  primaryColor = "#7c3aed",
  textColor = "#191919",
  readOnly = false,
}) => {
  const onAutoAdvanceRef = useRef(onAutoAdvance);
  onAutoAdvanceRef.current = onAutoAdvance;

  const handleSelect = (selected: "yes" | "no") => {
    if (readOnly) return;
    onChange(selected);
    setTimeout(() => onAutoAdvanceRef.current(), 220);
  };

  const btn = (opt: "yes" | "no", label: string, Icon: React.ElementType) => {
    const isSelected = value === opt;
    return (
      <button
        key={opt}
        type="button"
        disabled={readOnly}
        onClick={() => handleSelect(opt)}
        className="flex items-center gap-3 px-6 py-4 rounded-2xl border-2 text-lg font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] min-w-[140px] justify-center"
        style={{
          borderColor: isSelected ? primaryColor : "rgba(0,0,0,0.12)",
          backgroundColor: isSelected ? primaryColor : "transparent",
          color: isSelected ? "#fff" : textColor,
          boxShadow: isSelected ? `0 4px 20px ${primaryColor}40` : "none",
        }}
      >
        <Icon className="w-5 h-5" />
        {label}
      </button>
    );
  };

  return (
    <div className="flex gap-4 mt-2">
      {btn("yes", "Yes", ThumbsUp)}
      {btn("no", "No", ThumbsDown)}
    </div>
  );
};
