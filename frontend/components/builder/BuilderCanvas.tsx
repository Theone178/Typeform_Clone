"use client";

import React, { useState, useEffect, useRef } from "react";
import { Question } from "@/lib/types";
import { QuestionIcon } from "@/lib/questionIcons";
import { QUESTION_REGISTRY } from "@/lib/questionTypes";
import { cn } from "@/lib/utils";
import { QuestionRenderer } from "@/components/respondent/QuestionRenderer";

interface BuilderCanvasProps {
  question: Question | null;
  questionIndex: number;
  onTitleChange: (title: string) => void;
  onDescriptionChange: (description: string) => void;
}

const InlineEditable: React.FC<{
  value: string;
  placeholder: string;
  onChange: (v: string) => void;
  className?: string;
  multiline?: boolean;
}> = ({ value, placeholder, onChange, className, multiline }) => {
  const [editing, setEditing] = useState(false);
  const [local, setLocal] = useState(value);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLocal(value);
  }, [value]);

  useEffect(() => {
    if (editing && ref.current) {
      ref.current.focus();
      // Move cursor to end
      const range = document.createRange();
      const sel = window.getSelection();
      range.selectNodeContents(ref.current);
      range.collapse(false);
      sel?.removeAllRanges();
      sel?.addRange(range);
    }
  }, [editing]);

  const commit = () => {
    setEditing(false);
    const text = ref.current?.innerText?.trim() || "";
    if (text !== value) onChange(text);
    setLocal(text);
  };

  const sharedProps = {
    ref,
    contentEditable: editing,
    suppressContentEditableWarning: true,
    onFocus: () => setEditing(true),
    onBlur: commit,
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        if (ref.current) ref.current.innerText = value;
        setLocal(value);
        setEditing(false);
      }
      if (!multiline && e.key === "Enter") {
        e.preventDefault();
        commit();
      }
    },
    tabIndex: 0,
    className: cn(
      "outline-none cursor-text rounded focus:ring-2 focus:ring-purple-200 focus:ring-offset-1 transition-all",
      !local && "text-gray-400",
      className
    ),
  };

  return (
    <div
      className={cn(
        "group relative",
        !editing &&
          "hover:outline hover:outline-2 hover:outline-offset-2 hover:outline-purple-100 rounded"
      )}
    >
      <div {...sharedProps}>{local || placeholder}</div>
      {!editing && (
        <span className="absolute -top-5 left-0 text-[10px] text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none font-medium">
          Click to edit
        </span>
      )}
    </div>
  );
};

export const BuilderCanvas: React.FC<BuilderCanvasProps> = ({
  question,
  questionIndex,
  onTitleChange,
  onDescriptionChange,
}) => {
  if (!question) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#fbfbfb] p-12 text-center">
        <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
          <span className="text-2xl">📝</span>
        </div>
        <h3 className="text-lg font-semibold text-gray-700 mb-1">
          No question selected
        </h3>
        <p className="text-sm text-gray-400 max-w-xs">
          Select a question from the left panel, or add a new one to get started.
        </p>
      </div>
    );
  }

  const typeDef = QUESTION_REGISTRY[question.type];

  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-[#fbfbfb] p-8 overflow-y-auto">
      <div className="w-full max-w-2xl">
        {/* Type badge */}
        <div className="flex items-center gap-2 mb-6">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-50 text-purple-600 text-xs font-semibold border border-purple-100">
            <QuestionIcon type={question.type} className="w-3 h-3" />
            {typeDef?.label ?? question.type}
          </span>
          {question.required && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-red-50 text-red-500 text-xs font-semibold border border-red-100">
              Required
            </span>
          )}
        </div>

        {/* Question number + title */}
        <div className="flex items-start gap-3 mb-4">
          <span className="text-2xl font-bold text-purple-500 select-none mt-1 shrink-0">
            {questionIndex + 1} →
          </span>
          <div className="flex-1 space-y-3">
            <InlineEditable
              value={question.title}
              placeholder="Untitled question"
              onChange={onTitleChange}
              className="text-3xl font-semibold text-gray-900 leading-tight w-full"
            />
            <InlineEditable
              value={question.description || ""}
              placeholder="Add a description (optional)"
              onChange={onDescriptionChange}
              className="text-base text-gray-500 leading-relaxed w-full"
              multiline
            />
          </div>
        </div>

        {/* Read-only respondent preview */}
        <div className="mt-8 ml-10">
          <div className="w-full rounded-2xl border border-gray-200 bg-white">
            <QuestionRenderer
              question={question}
              index={questionIndex}
              value={undefined}
              onChange={() => undefined}
              onNext={() => undefined}
              readOnly
            />
          </div>
        </div>
      </div>
    </div>
  );
};
