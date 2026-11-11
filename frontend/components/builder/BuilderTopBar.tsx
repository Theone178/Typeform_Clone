"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Globe,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { FormResponse } from "@/lib/types";
import { cn } from "@/lib/utils";

export type BuilderTab = "create" | "design" | "settings";

interface BuilderTopBarProps {
  form: FormResponse;
  activeTab: BuilderTab;
  onTabChange: (tab: BuilderTab) => void;
  saveStatus: "idle" | "saving" | "saved" | "error";
  onPublish: () => void;
  onTitleChange: (title: string) => void;
}

export const BuilderTopBar: React.FC<BuilderTopBarProps> = ({
  form,
  activeTab,
  onTabChange,
  saveStatus,
  onPublish,
  onTitleChange,
}) => {
  const [editing, setEditing] = useState(false);
  const [localTitle, setLocalTitle] = useState(form.title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLocalTitle(form.title);
  }, [form.title]);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const commitTitle = () => {
    setEditing(false);
    const trimmed = localTitle.trim() || "Untitled form";
    setLocalTitle(trimmed);
    if (trimmed !== form.title) {
      onTitleChange(trimmed);
    }
  };

  const tabs: { id: BuilderTab; label: string }[] = [
    { id: "create", label: "Create" },
    { id: "design", label: "Design" },
    { id: "settings", label: "Settings" },
  ];

  return (
    <header className="h-14 border-b border-gray-200 bg-white flex items-center justify-between px-4 shrink-0 z-10">
      {/* Left: Back + Title */}
      <div className="flex items-center gap-3 min-w-0">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-900 transition-colors shrink-0"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">My workspace</span>
        </Link>
        <span className="text-gray-200 shrink-0">/</span>

        {editing ? (
          <input
            ref={inputRef}
            value={localTitle}
            onChange={(e) => setLocalTitle(e.target.value)}
            onBlur={commitTitle}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitTitle();
              if (e.key === "Escape") {
                setLocalTitle(form.title);
                setEditing(false);
              }
            }}
            className="text-sm font-semibold text-gray-900 bg-transparent border-b border-purple-400 outline-none min-w-0 max-w-[200px]"
          />
        ) : (
          <button
            onClick={() => setEditing(true)}
            className="text-sm font-semibold text-gray-900 hover:text-purple-700 truncate max-w-[200px] transition-colors text-left"
            title="Click to rename"
          >
            {localTitle}
          </button>
        )}
      </div>

      {/* Center: Tabs */}
      <nav className="flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "px-4 py-1.5 rounded-lg text-sm font-medium transition-all",
              activeTab === tab.id
                ? "bg-purple-50 text-purple-700"
                : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
            )}
          >
            {tab.label}
          </button>
        ))}
        <Link
          href={`/forms/${form.id}/responses`}
          className="px-4 py-1.5 rounded-lg text-sm font-medium text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all"
        >
          Results ↗
        </Link>
      </nav>

      {/* Right: Status + Buttons */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Autosave status */}
        <span className="text-xs text-gray-400 hidden sm:flex items-center gap-1.5 mr-1">
          {saveStatus === "saving" && (
            <>
              <Loader2 className="w-3 h-3 animate-spin" />
              Saving...
            </>
          )}
          {saveStatus === "saved" && (
            <>
              <CheckCircle2 className="w-3 h-3 text-green-500" />
              Saved
            </>
          )}
          {saveStatus === "error" && (
            <span className="text-red-500">Save failed</span>
          )}
        </span>

        <button
          type="button"
          onClick={onPublish}
          className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 transition-all shadow-sm"
        >
          <Globe className="w-3.5 h-3.5" />
          {form.status === "published" ? "Published" : "Publish"}
        </button>
      </div>
    </header>
  );
};
