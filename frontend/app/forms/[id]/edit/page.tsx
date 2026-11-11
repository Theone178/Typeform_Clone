"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Sparkles, Hammer, ExternalLink } from "lucide-react";
import { api } from "@/lib/api";
import { FormResponse } from "@/lib/types";

export default function FormEditPlaceholderPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [form, setForm] = useState<FormResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!id) return;
    api
      .getForm(id)
      .then((data) => setForm(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <div className="min-h-screen bg-[#fbfbfb] text-[#262626] flex flex-col">
      {/* Top Bar */}
      <header className="h-14 border-b border-gray-200 bg-white px-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>My workspace</span>
          </Link>
          <span className="text-gray-300">/</span>
          <span className="text-sm font-semibold text-gray-900 truncate max-w-xs">
            {loading ? "Loading..." : form?.title || "Untitled form"}
          </span>
        </div>

        {form?.status === "published" && (
          <Link
            href={`/f/${form.slug}`}
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
          >
            <span>View public</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        )}
      </header>

      {/* Main Content Placeholder */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-lg mx-auto">
        <div className="w-16 h-16 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mb-6 shadow-sm border border-purple-100">
          <Hammer className="w-8 h-8" />
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Step 4 • Form Builder</span>
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-gray-900 mb-2">
          Builder Coming Soon
        </h1>

        <p className="text-sm text-gray-500 leading-relaxed mb-6">
          The 3-pane live builder with drag-and-drop question reordering, real-time preview, and question settings will be built in the next step.
        </p>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="px-5 py-2.5 rounded-xl text-sm font-medium bg-gray-900 text-white hover:bg-gray-800 transition-colors shadow-sm"
          >
            Back to Workspace
          </button>
        </div>
      </main>
    </div>
  );
}
