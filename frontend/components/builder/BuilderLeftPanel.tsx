"use client";

import React from "react";
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { CopyPlus, GripVertical, Plus, Trash2 } from "lucide-react";
import { Question } from "@/lib/types";
import { QuestionIcon } from "@/lib/questionIcons";
import { cn } from "@/lib/utils";

interface BuilderLeftPanelProps {
  questions: Question[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAddQuestion: () => void;
  onDelete: (question: Question) => void;
  onDuplicate: (id: string) => void;
  onReorder: (questionIds: string[]) => void;
  busy?: boolean;
}

interface SortableQuestionRowProps {
  question: Question;
  index: number;
  selected: boolean;
  busy: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
}

const SortableQuestionRow: React.FC<SortableQuestionRowProps> = ({
  question,
  index,
  selected,
  busy,
  onSelect,
  onDelete,
  onDuplicate,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: question.id, disabled: busy });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={cn(
        "group flex items-center border-l-2 pr-2 transition-colors",
        selected
          ? "bg-purple-50 border-l-purple-500"
          : "border-l-transparent hover:bg-gray-100",
        isDragging && "relative z-10 opacity-80 shadow-lg"
      )}
    >
      <button
        type="button"
        onClick={onSelect}
        className="flex min-w-0 flex-1 items-center gap-3 py-3 pl-4 text-left"
      >
        <span
          className={cn(
            "w-5 shrink-0 text-xs font-bold tabular-nums",
            selected ? "text-purple-500" : "text-gray-400"
          )}
        >
          {index + 1}
        </span>
        <span
          className={cn(
            "shrink-0 transition-colors",
            selected ? "text-purple-500" : "text-gray-400 group-hover:text-gray-600"
          )}
        >
          <QuestionIcon type={question.type} className="h-3.5 w-3.5" />
        </span>
        <span
          className={cn(
            "truncate text-sm leading-tight",
            selected ? "font-medium text-purple-700" : "text-gray-700"
          )}
        >
          {question.title || "Untitled question"}
        </span>
      </button>
      <div className="flex shrink-0 items-center opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
        <button
          type="button"
          aria-label={`Drag to reorder ${question.title || "question"}`}
          disabled={busy}
          {...attributes}
          {...listeners}
          className="cursor-grab rounded p-1.5 text-gray-400 hover:bg-white hover:text-gray-700 active:cursor-grabbing disabled:opacity-50"
        >
          <GripVertical className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          aria-label={`Duplicate ${question.title || "question"}`}
          disabled={busy}
          onClick={onDuplicate}
          className="rounded p-1.5 text-gray-400 hover:bg-white hover:text-purple-600 disabled:opacity-50"
        >
          <CopyPlus className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          aria-label={`Delete ${question.title || "question"}`}
          disabled={busy}
          onClick={onDelete}
          className="rounded p-1.5 text-gray-400 hover:bg-white hover:text-red-500 disabled:opacity-50"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};

export const BuilderLeftPanel: React.FC<BuilderLeftPanelProps> = ({
  questions,
  selectedId,
  onSelect,
  onAddQuestion,
  onDelete,
  onDuplicate,
  onReorder,
  busy = false,
}) => {
  const sorted = [...questions].sort((a, b) => a.position - b.position);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const oldIndex = sorted.findIndex((question) => question.id === active.id);
    const newIndex = sorted.findIndex((question) => question.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    onReorder(arrayMove(sorted, oldIndex, newIndex).map((question) => question.id));
  };

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
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={sorted.map((question) => question.id)}
              strategy={verticalListSortingStrategy}
            >
              {sorted.map((question, index) => (
                <SortableQuestionRow
                  key={question.id}
                  question={question}
                  index={index}
                  selected={selectedId === question.id}
                  busy={busy}
                  onSelect={() => onSelect(question.id)}
                  onDelete={() => onDelete(question)}
                  onDuplicate={() => onDuplicate(question.id)}
                />
              ))}
            </SortableContext>
          </DndContext>
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
