"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Clock3, FileText } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { AnswerResponse } from "@/lib/types";

function formatValue(value: AnswerResponse["value"]): string {
  if (Array.isArray(value)) return value.map(formatValue).join(", ");
  if (value === null || value === undefined || value === "") return "No answer";
  if (typeof value === "object") return JSON.stringify(value, null, 2);
  return String(value);
}

export default function FormResponseDetailPage() {
  const { id, responseId } = useParams<{ id: string; responseId: string }>();
  const formQuery = useQuery({
    queryKey: ["form", id],
    queryFn: () => api.getForm(id),
    enabled: Boolean(id),
  });
  const responseQuery = useQuery({
    queryKey: ["form-response", id, responseId],
    queryFn: () => api.getFormResponse(id, responseId),
    enabled: Boolean(id && responseId),
  });

  const answerByQuestionId = useMemo(
    () =>
      new Map(
        (responseQuery.data?.answers ?? []).map((answer) => [
          answer.question_id,
          answer,
        ])
      ),
    [responseQuery.data]
  );

  if (formQuery.isLoading || responseQuery.isLoading) {
    return (
      <main className="min-h-screen bg-[#fbfbfb] p-6 sm:p-10">
        <div className="mx-auto max-w-3xl animate-pulse space-y-5">
          <div className="h-6 w-40 rounded bg-gray-200" />
          <div className="h-28 rounded-2xl bg-gray-100" />
          <div className="h-48 rounded-2xl bg-gray-100" />
        </div>
      </main>
    );
  }

  const error = formQuery.error ?? responseQuery.error;
  if (error || !formQuery.data || !responseQuery.data) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-3 bg-[#fbfbfb] p-6 text-center">
        <h1 className="text-lg font-semibold text-gray-900">Could not load this response</h1>
        <p className="text-sm text-gray-500">
          {error instanceof Error ? error.message : "The response was not found."}
        </p>
        <Link
          href={`/forms/${id}/responses`}
          className="text-sm font-medium text-purple-700 hover:underline"
        >
          Back to responses
        </Link>
      </main>
    );
  }

  const form = formQuery.data;
  const response = responseQuery.data;
  const questions = [...(form.questions ?? [])].sort(
    (a, b) => a.position - b.position
  );

  return (
    <main className="min-h-screen bg-[#fbfbfb] px-4 py-6 text-gray-900 sm:px-8 sm:py-10">
      <div className="mx-auto max-w-3xl space-y-6">
        <header>
          <Link
            href={`/forms/${id}/responses`}
            className="mb-3 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
            All responses
          </Link>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {form.title}
          </h1>
          <p className="mt-1 text-sm text-gray-500">Individual response</p>
        </header>

        <section className="flex flex-wrap gap-x-6 gap-y-3 rounded-2xl border border-gray-200 bg-white p-5 text-sm text-gray-600 shadow-sm">
          <span className="inline-flex items-center gap-2">
            <FileText className="h-4 w-4 text-purple-500" />
            Submitted {new Date(response.submitted_at).toLocaleString()}
          </span>
          <span className="inline-flex items-center gap-2">
            <Clock3 className="h-4 w-4 text-purple-500" />
            {response.duration_seconds === null ||
            response.duration_seconds === undefined
              ? "Duration unavailable"
              : response.duration_seconds < 60
                ? `${Math.round(response.duration_seconds)} seconds`
                : `${Math.floor(response.duration_seconds / 60)}m ${Math.round(
                    response.duration_seconds % 60
                  )}s`}
          </span>
        </section>

        <section className="space-y-3">
          {questions.map((question, index) => {
            const answer = answerByQuestionId.get(question.id);
            return (
              <article
                key={question.id}
                className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-purple-600">
                  Question {index + 1}
                </p>
                <h2 className="mt-1 font-semibold text-gray-900">
                  {question.title}
                </h2>
                {question.description && (
                  <p className="mt-1 text-sm text-gray-500">
                    {question.description}
                  </p>
                )}
                <pre className="mt-4 whitespace-pre-wrap break-words rounded-xl bg-gray-50 p-4 font-sans text-sm leading-relaxed text-gray-700">
                  {formatValue(answer?.value)}
                </pre>
              </article>
            );
          })}
        </section>
      </div>
    </main>
  );
}
