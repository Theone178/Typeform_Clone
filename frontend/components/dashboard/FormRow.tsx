"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  MoreHorizontal,
  Copy,
  ExternalLink,
  Edit2,
  Trash2,
  Globe,
  Archive,
  Check,
  X,
  CopyCheck,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { FormListItem } from "@/lib/types";

interface FormRowProps {
  form: FormListItem;
  onRename: (id: string, newTitle: string) => Promise<void>;
  onDuplicate: (id: string) => Promise<void>;
  onTogglePublish: (id: string, currentStatus: string) => Promise<void>;
  onOpenDelete: (form: FormListItem) => void;
}

export function formatTimeAgo(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSeconds < 60) return "Just now";
    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  } catch {
    return dateStr;
  }
}

export const FormRow: React.FC<FormRowProps> = ({
  form,
  onRename,
  onDuplicate,
  onTogglePublish,
  onOpenDelete,
}) => {
  const [isRenaming, setIsRenaming] = useState<boolean>(false);
  const [titleInput, setTitleInput] = useState<string>(form.title);
  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTitleInput(form.title);
  }, [form.title]);

  useEffect(() => {
    if (isRenaming && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [isRenaming]);

  // Click outside to close three-dot menu
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  const handleCopyLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    const publicUrl = `${window.location.origin}/f/${form.slug}`;
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    toast.success("Link copied to clipboard", {
      description: publicUrl,
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveRename = async () => {
    const trimmed = titleInput.trim();
    if (!trimmed || trimmed === form.title) {
      setIsRenaming(false);
      setTitleInput(form.title);
      return;
    }
    try {
      await onRename(form.id, trimmed);
      setIsRenaming(false);
    } catch {
      // toast is handled in parent mutation
    }
  };

  const handleKeyDownRename = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSaveRename();
    } else if (e.key === "Escape") {
      setIsRenaming(false);
      setTitleInput(form.title);
    }
  };

  const isPublished = form.status === "published";

  return (
    <div className="group relative flex items-center justify-between p-4 sm:px-6 rounded-2xl bg-white border border-gray-200/80 hover:border-gray-300 hover:shadow-xs transition-all duration-150">
      {/* Left: Form Info / Inline Rename */}
      <div className="flex items-center gap-4 flex-1 min-w-0 pr-4">
        <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0 group-hover:bg-purple-100 transition-colors">
          <FileText className="w-5 h-5" />
        </div>

        <div className="flex-1 min-w-0">
          {isRenaming ? (
            <div className="flex items-center gap-2 max-w-md">
              <input
                ref={renameInputRef}
                type="text"
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                onKeyDown={handleKeyDownRename}
                className="w-full px-2.5 py-1 text-sm font-semibold rounded-lg border border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200 bg-white"
              />
              <button
                type="button"
                onClick={handleSaveRename}
                className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                title="Save"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsRenaming(false);
                  setTitleInput(form.title);
                }}
                className="p-1 text-gray-400 hover:bg-gray-100 rounded"
                title="Cancel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href={`/forms/${form.id}/edit`}
                className="font-semibold text-sm sm:text-base text-gray-900 hover:text-purple-600 transition-colors truncate"
              >
                {form.title}
              </Link>
            </div>
          )}

          <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
            <span>{form.question_count} {form.question_count === 1 ? "question" : "questions"}</span>
            <span>•</span>
            <span>Updated {formatTimeAgo(form.updated_at)}</span>
          </div>
        </div>
      </div>

      {/* Middle: Badges & Responses */}
      <div className="flex items-center gap-4 sm:gap-6 flex-shrink-0">
        {/* Responses Count */}
        <div className="text-right hidden sm:block">
          <span className="text-sm font-semibold text-gray-900">
            {form.response_count}
          </span>
          <span className="text-xs text-gray-400 ml-1">
            {form.response_count === 1 ? "response" : "responses"}
          </span>
        </div>

        {/* Status Badge */}
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
            isPublished
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200/80"
              : "bg-gray-100 text-gray-600 border border-gray-200/80"
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isPublished ? "bg-emerald-500" : "bg-gray-400"
            }`}
          />
          <span className="capitalize">{form.status}</span>
        </span>

        {/* Quick Link Action for Published Forms */}
        {isPublished && (
          <div className="flex items-center gap-1 hidden md:flex">
            <button
              type="button"
              onClick={handleCopyLink}
              title="Copy public link"
              className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            >
              {copied ? (
                <CopyCheck className="w-4 h-4 text-emerald-600" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
            <Link
              href={`/f/${form.slug}`}
              target="_blank"
              title="Open public form"
              className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
            </Link>
          </div>
        )}

        {/* Three-Dot Menu */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label="More options"
            className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-48 rounded-xl bg-white shadow-xl border border-gray-100 py-1 z-30 animate-fadeIn">
              {/* Rename */}
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  setIsRenaming(true);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Edit2 className="w-3.5 h-3.5 text-gray-400" />
                <span>Rename</span>
              </button>

              {/* Copy Link (if published) */}
              {isPublished && (
                <button
                  type="button"
                  onClick={(e) => {
                    setMenuOpen(false);
                    handleCopyLink(e);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Copy className="w-3.5 h-3.5 text-gray-400" />
                  <span>Copy link</span>
                </button>
              )}

              {/* Duplicate */}
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onDuplicate(form.id);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <FileText className="w-3.5 h-3.5 text-gray-400" />
                <span>Duplicate</span>
              </button>

              {/* Publish / Unpublish */}
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onTogglePublish(form.id, form.status);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                {isPublished ? (
                  <>
                    <Archive className="w-3.5 h-3.5 text-amber-500" />
                    <span>Unpublish to draft</span>
                  </>
                ) : (
                  <>
                    <Globe className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Publish form</span>
                  </>
                )}
              </button>

              <div className="h-px bg-gray-100 my-1" />

              {/* Delete */}
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onOpenDelete(form);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-500" />
                <span>Delete</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
