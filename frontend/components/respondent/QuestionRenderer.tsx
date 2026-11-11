"use client";

import React, { useRef, useEffect } from "react";
import { Check, AlertCircle } from "lucide-react";
import { Question } from "@/lib/types";
import { extractOptionStrings, QUESTION_TYPES } from "@/lib/questionTypes";
import { ChoiceInput } from "./inputs/ChoiceInput";
import { MultipleChoiceInput } from "./inputs/MultipleChoiceInput";
import { RatingInput } from "./inputs/RatingInput";

interface QuestionRendererProps {
  question: Question;
  index: number;
  value: any;
  onChange: (value: any) => void;
  onNext: () => void;
  error?: string | null;
  primaryColor?: string;
  textColor?: string;
  readOnly?: boolean;
}

export const QuestionRenderer: React.FC<QuestionRendererProps> = ({
  question,
  index,
  value,
  onChange,
  onNext,
  error,
  primaryColor = "#7c3aed",
  textColor = "#191919",
  readOnly = false,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus input on question display
  useEffect(() => {
    if (!readOnly && inputRef.current) {
      inputRef.current.focus();
    }
  }, [question.id, readOnly]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onNext();
    }
  };

  const renderInput = () => {
    const qType = question.type;
    const config = question.config || {};

    switch (qType) {
      case QUESTION_TYPES.TEXT:
        return (
          <div className="w-full max-w-xl">
            <input
              ref={inputRef}
              type="text"
              value={value ?? ""}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={readOnly}
              placeholder={config.placeholder || "Type your answer here..."}
              maxLength={config.max_length}
              className="w-full bg-transparent border-b-2 py-3 text-2xl sm:text-3xl font-light placeholder:opacity-30 focus:outline-none transition-colors"
              style={{
                borderColor: error ? "#ef4444" : "rgba(150, 150, 150, 0.3)",
                color: textColor,
              }}
            />
          </div>
        );

      case QUESTION_TYPES.EMAIL:
        return (
          <div className="w-full max-w-xl">
            <input
              ref={inputRef}
              type="email"
              value={value ?? ""}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={readOnly}
              placeholder={config.placeholder || "name@example.com"}
              className="w-full bg-transparent border-b-2 py-3 text-2xl sm:text-3xl font-light placeholder:opacity-30 focus:outline-none transition-colors"
              style={{
                borderColor: error ? "#ef4444" : "rgba(150, 150, 150, 0.3)",
                color: textColor,
              }}
            />
          </div>
        );

      case QUESTION_TYPES.NUMBER:
        return (
          <div className="w-full max-w-xs">
            <input
              ref={inputRef}
              type="number"
              value={value ?? ""}
              min={config.min}
              max={config.max}
              onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
              onKeyDown={handleKeyDown}
              disabled={readOnly}
              placeholder={config.placeholder || "0"}
              className="w-full bg-transparent border-b-2 py-3 text-2xl sm:text-3xl font-light placeholder:opacity-30 focus:outline-none transition-colors"
              style={{
                borderColor: error ? "#ef4444" : "rgba(150, 150, 150, 0.3)",
                color: textColor,
              }}
            />
            {(config.min !== undefined || config.max !== undefined) && (
              <p className="mt-2 text-xs opacity-50">
                Range: {config.min ?? "-∞"} to {config.max ?? "+∞"}
              </p>
            )}
          </div>
        );

      case QUESTION_TYPES.CHOICE:
        return (
          <ChoiceInput
            options={config.options}
            value={value}
            onChange={onChange}
            onAutoAdvance={onNext}
            primaryColor={primaryColor}
            textColor={textColor}
            readOnly={readOnly}
          />
        );

      case QUESTION_TYPES.MULTIPLE_CHOICE:
        return (
          <MultipleChoiceInput
            options={config.options}
            value={value}
            onChange={onChange}
            primaryColor={primaryColor}
            textColor={textColor}
            readOnly={readOnly}
          />
        );

      case QUESTION_TYPES.RATING:
        return (
          <RatingInput
            scale={config.rating_scale ?? config.max ?? 5}
            value={value}
            onChange={onChange}
            onAutoAdvance={onNext}
            primaryColor={primaryColor}
            textColor={textColor}
            readOnly={readOnly}
          />
        );

      case QUESTION_TYPES.DROPDOWN: {
        const optionStrings = extractOptionStrings(config.options);
        return (
          <div className="w-full max-w-xl">
            <select
              value={value ?? ""}
              onChange={(e) => onChange(e.target.value)}
              disabled={readOnly}
              className="w-full bg-transparent border-2 border-black/10 dark:border-white/10 rounded-xl px-4 py-3.5 text-lg sm:text-xl font-medium focus:outline-none transition-colors cursor-pointer"
              style={{ color: textColor }}
            >
              <option value="" disabled className="text-gray-500">
                Select an option...
              </option>
              {optionStrings.map((opt) => (
                <option key={opt} value={opt} className="text-black bg-white">
                  {opt}
                </option>
              ))}
            </select>
          </div>
        );
      }

      default:
        return (
          <div className="w-full max-w-xl">
            <input
              type="text"
              value={value ?? ""}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={readOnly}
              className="w-full bg-transparent border-b-2 py-3 text-2xl"
            />
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col items-start justify-center max-w-2xl w-full mx-auto px-6 py-8">
      {/* Question Header */}
      <div className="flex items-start gap-2.5 mb-3">
        <span
          className="text-base sm:text-lg font-semibold flex items-center gap-1 select-none"
          style={{ color: primaryColor }}
        >
          {index + 1}
          <span>→</span>
        </span>

        <div className="space-y-1.5">
          <h2
            className="text-2xl sm:text-3xl font-medium tracking-tight leading-snug"
            style={{ color: textColor }}
          >
            {question.title}
            {question.required && (
              <span className="text-red-500 ml-1.5 font-bold" title="Required">
                *
              </span>
            )}
          </h2>

          {question.description && (
            <p className="text-base sm:text-lg opacity-70 font-normal leading-relaxed">
              {question.description}
            </p>
          )}
        </div>
      </div>

      {/* Input */}
      <div className="w-full my-6">{renderInput()}</div>

      {/* Inline Validation Error */}
      {error && (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 text-sm font-medium mb-4 animate-shake">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* OK / Next Button with Enter shortcut */}
      <div className="flex items-center gap-3 mt-2">
        <button
          type="button"
          onClick={onNext}
          disabled={readOnly}
          className="group inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-white shadow-md hover:opacity-95 active:scale-95 transition-all text-base"
          style={{ backgroundColor: primaryColor }}
        >
          <span>OK</span>
          <Check className="w-4 h-4" />
        </button>

        <span className="text-xs uppercase tracking-wider font-semibold opacity-50 flex items-center gap-1 select-none">
          press <kbd className="px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10 font-mono text-[11px]">Enter ↵</kbd>
        </span>
      </div>
    </div>
  );
};
