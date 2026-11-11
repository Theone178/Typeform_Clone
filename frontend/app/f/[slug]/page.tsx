"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AlertCircle, HelpCircle, Loader2, RefreshCw } from "lucide-react";
import { PublicForm } from "@/lib/types";
import { api, ApiError, API_BASE_URL } from "@/lib/api";
import { RespondentFlow } from "@/components/respondent/RespondentFlow";

export default function FormRespondentPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [form, setForm] = useState<PublicForm | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<{ status?: number; message: string } | null>(null);

  const loadForm = async () => {
    if (!slug) return;
    setLoading(true);
    setError(null);

    try {
      const data = await api.getPublicForm(slug);
      setForm(data);
    } catch (err: any) {
      if (err instanceof ApiError) {
        setError({
          status: err.status,
          message: err.message,
        });
      } else {
        setError({
          message: `Unable to connect to the backend server at ${API_BASE_URL}. Please ensure the FastAPI backend is running.`,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadForm();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200">
        <Loader2 className="w-10 h-10 animate-spin text-purple-600 mb-4" />
        <p className="text-sm font-medium opacity-60">Loading form...</p>
      </div>
    );
  }

  if (error) {
    const is404 = error.status === 404;
    const is403 = error.status === 403;

    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
        <div className="max-w-md w-full p-8 rounded-2xl bg-white dark:bg-zinc-900 shadow-xl border border-zinc-200 dark:border-zinc-800 text-center space-y-5">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center">
            {is404 ? <HelpCircle className="w-8 h-8" /> : <AlertCircle className="w-8 h-8" />}
          </div>

          <h2 className="text-2xl font-bold tracking-tight">
            {is404
              ? "Form Not Found"
              : is403
              ? "Form Unpublished"
              : "Connection Error"}
          </h2>

          <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed">
            {error.message}
          </p>

          <button
            type="button"
            onClick={loadForm}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:opacity-90 transition-opacity"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Try Again</span>
          </button>
        </div>
      </div>
    );
  }

  if (!form) return null;

  return <RespondentFlow form={form} />;
}
