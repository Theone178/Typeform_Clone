"use client";

import React from "react";
import { Plus } from "lucide-react";
import { Question } from "@/lib/types";
import { QuestionIcon } from "@/lib/questionIcons";
import { cn } from "@/lib/utils";

interface BuilderLeftPanelProps {
  questions: Question[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAddQuestion: () => void;
}

export const BuilderLeftPanel: React.FC<BuilderLeftPanelProps> = ({
  questions,
  selectedId,
  onSelect,
  onAddQuestion,
}) => {
  const sorted = [...questions].sort((a, b) => a.position - b.position);

  return (
    <aside className="w-64 border-r border-gray-200 bg-[#fbfbfb] flex flex-col shrink-0">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Questions
        </span>
      </div>

      {/* Question List */}
      <div className="flex-1 overflow-y-auto py-2">
        {sorted.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <p className="text-xs text-gray-400">No questions yet</p>
            <p className="text-xs text-gray-300 mt-1">
              Click "Add question" below
            </p>
          </div>
        ) : (
          sorted.map((q, idx) => (
            <button
              key={q.id}
              onClick={() => onSelect(q.id)}
              className={cn(
                "w-full text-left px-4 py-3 flex items-center gap-3 transition-all group border-l-2",
                selectedId === q.id
                  ? "bg-purple-50 border-l-purple-500"
                  : "border-l-transparent hover:bg-gray-100"
              )}
            >
              {/* Number */}
              <span
                className={cn(
                  "text-xs font-bold w-5 shrink-0 tabular-nums",
                  selectedId === q.id ? "text-purple-500" : "text-gray-400"
                )}
              >
                {idx + 1}
              </span>

              {/* Type icon */}
              <span
                className={cn(
                  "shrink-0 transition-colors",
                  selectedId === q.id ? "text-purple-500" : "text-gray-400 group-hover:text-gray-600"
                )}
              >
                <QuestionIcon type={q.type} className="w-3.5 h-3.5" />
              </span>

              {/* Title */}
              <span
                className={cn(
                  "text-sm truncate leading-tight",
                  selectedId === q.id
                    ? "text-purple-700 font-medium"
                    : "text-gray-700"
                )}
              >
                {q.title || "Untitled question"}
              </span>
            </button>
          ))
        )}
      </div>

      {/* Add Question Button */}
      <div className="p-3 border-t border-gray-200">
        <button
          onClick={onAddQuestion}
          className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-sm font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border-2 border-dashed border-purple-200 hover:border-purple-300 transition-all"
        >
          <Plus className="w-4 h-4" />
          Add question
        </button>
      </div>
    </aside>
  );
};
