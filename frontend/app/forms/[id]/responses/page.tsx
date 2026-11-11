"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, BarChart3, Clock3, FileText, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { AnswerResponse } from "@/lib/types";

function formatAnswer(value: AnswerResponse["value"]): string {
  if (Array.isArray(value)) return value.join(", ");
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function formatDuration(seconds?: number | null): string {
  if (seconds === null || seconds === undefined) return "—";
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const minutes = Math.floor(seconds / 60);
  return `${minutes}m ${Math.round(seconds % 60)}s`;
}

export default function FormResponsesPage() {
  const { id } = useParams<{ id: string }>();
  const formQuery = useQuery({
    queryKey: ["form", id],
    queryFn: () => api.getForm(id),
    enabled: Boolean(id),
  });
  const responsesQuery = useQuery({
    queryKey: ["form-responses", id],
    queryFn: () => api.getFormResponses(id),
    enabled: Boolean(id),
  });
  const statsQuery = useQuery({
    queryKey: ["form-stats", id],
    queryFn: () => api.getFormStats(id),
    enabled: Boolean(id),
  });

  const error = formQuery.error ?? responsesQuery.error;
  const isLoading = formQuery.isLoading || responsesQuery.isLoading;

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#fbfbfb] p-6 sm:p-10">
        <div className="mx-auto max-w-6xl animate-pulse space-y-6">
          <div className="h-8 w-64 rounded bg-gray-200" />
          <div className="h-24 rounded-2xl bg-gray-100" />
          <div className="h-72 rounded-2xl bg-gray-100" />
        </div>
      </main>
    );
  }

  if (error || !formQuery.data) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-3 bg-[#fbfbfb] p-6 text-center">
        <h1 className="text-lg font-semibold text-gray-900">Could not load responses</h1>
        <p className="text-sm text-gray-500">
          {error instanceof Error ? error.message : "The form was not found."}
        </p>
        <Link href="/" className="text-sm font-medium text-purple-700 hover:underline">
          Back to workspace
        </Link>
      </main>
    );
  }

  const form = formQuery.data;
  const responses = responsesQuery.data ?? [];
  const stats = statsQuery.data;
  const questions = [...(form.questions ?? [])].sort((a, b) => a.position - b.position);

  return (
    <main className="min-h-screen bg-[#fbfbfb] px-4 py-6 text-gray-900 sm:px-8 sm:py-10">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link
              href={`/forms/${id}/edit`}
              className="mb-3 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to builder
            </Link>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              {form.title} <span className="font-normal text-gray-400">/ Responses</span>
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Submissions and question summaries for this form.
            </p>
          </div>
          <Link
            href="/"
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            Workspace
          </Link>
        </header>

        <section className="grid gap-4 sm:grid-cols-3">
          <SummaryCard
            icon={<FileText className="h-5 w-5" />}
            label="Total responses"
            value={String(stats?.total_responses ?? responses.length)}
          />
          <SummaryCard
            icon={<BarChart3 className="h-5 w-5" />}
            label="Completion rate"
            value={`${stats?.completion_rate ?? 0}%`}
          />
          <SummaryCard
            icon={<Clock3 className="h-5 w-5" />}
            label="Average completion"
            value={formatDuration(stats?.average_duration_seconds)}
          />
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Question summary</h2>
            {statsQuery.isFetching && (
              <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
            )}
          </div>
          {statsQuery.error ? (
            <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              Could not load summary statistics:{" "}
              {statsQuery.error instanceof Error
                ? statsQuery.error.message
                : "Please try again."}
            </p>
          ) : stats && stats.questions_stats.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {stats.questions_stats.map((questionStats) => (
                <article
                  key={questionStats.question_id}
                  className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate font-semibold">{questionStats.title}</h3>
                      <p className="mt-1 text-xs capitalize text-gray-400">
                        {questionStats.type.replaceAll("_", " ")}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-purple-50 px-2.5 py-1 text-xs font-semibold text-purple-700">
                      {questionStats.total_answers} answers
                    </span>
                  </div>

                  {questionStats.data.options_breakdown ? (
                    <ul className="mt-4 space-y-2">
                      {questionStats.data.options_breakdown.map((option) => (
                        <li key={option.option} className="flex items-center gap-3 text-sm">
                          <span className="min-w-0 flex-1 truncate text-gray-600">
                            {option.option}
                          </span>
                          <span className="w-8 text-right font-medium">{option.count}</span>
                          <span className="w-12 text-right text-xs text-gray-400">
                            {option.percentage}%
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : questionStats.data.average !== undefined ? (
                    <p className="mt-4 text-sm text-gray-600">
                      Average:{" "}
                      <span className="font-semibold">
                        {questionStats.data.average ?? "—"}
                      </span>
                      {questionStats.data.min !== null &&
                        questionStats.data.max !== null &&
                        ` · Range ${questionStats.data.min}–${questionStats.data.max}`}
                    </p>
                  ) : questionStats.data.recent_answers?.length ? (
                    <p className="mt-4 line-clamp-3 text-sm text-gray-500">
                      Recent: {questionStats.data.recent_answers.join(" · ")}
                    </p>
                  ) : (
                    <p className="mt-4 text-sm text-gray-400">No answers yet.</p>
                  )}
                </article>
              ))}
            </div>
          ) : (
            <p className="rounded-xl border border-gray-200 bg-white p-5 text-sm text-gray-500">
              No questions to summarize yet.
            </p>
          )}
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">All responses</h2>
            <span className="text-sm text-gray-500">{responses.length} submissions</span>
          </div>
          {responsesQuery.error ? (
            <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              Could not load responses:{" "}
              {responsesQuery.error instanceof Error
                ? responsesQuery.error.message
                : "Please try again."}
            </p>
          ) : responses.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center">
              <FileText className="mx-auto h-8 w-8 text-gray-300" />
              <h3 className="mt-3 font-semibold">No responses yet</h3>
              <p className="mt-1 text-sm text-gray-500">
                Submissions will appear here after someone completes your form.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                    <tr>
                      <th className="px-5 py-3 font-medium">Submitted</th>
                      <th className="px-5 py-3 font-medium">Answers</th>
                      <th className="px-5 py-3 font-medium">Duration</th>
                      <th className="px-5 py-3 font-medium">Response</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {responses.map((response, index) => (
                      <tr key={response.id} className="hover:bg-gray-50">
                        <td className="whitespace-nowrap px-5 py-4 text-gray-600">
                          {new Date(response.submitted_at).toLocaleString()}
                        </td>
                        <td className="px-5 py-4 text-gray-600">
                          {response.answers.length} / {questions.length}
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-gray-600">
                          {formatDuration(response.duration_seconds)}
                        </td>
                        <td className="px-5 py-4">
                          <Link
                            href={`/forms/${id}/responses/${response.id}`}
                            className="font-medium text-purple-700 hover:text-purple-900"
                          >
                            View response {index + 1} →
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function SummaryCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <article className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
        {icon}
      </span>
      <span>
        <span className="block text-xs text-gray-500">{label}</span>
        <span className="mt-1 block text-xl font-bold">{value}</span>
      </span>
    </article>
  );
}
