"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Copy, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { BuilderCanvas } from "@/components/builder/BuilderCanvas";
import { BuilderLeftPanel } from "@/components/builder/BuilderLeftPanel";
import { BuilderRightPanel } from "@/components/builder/BuilderRightPanel";
import { BuilderTab, BuilderTopBar } from "@/components/builder/BuilderTopBar";
import { api, QuestionUpdatePayload } from "@/lib/api";
import { QUESTION_REGISTRY } from "@/lib/questionTypes";
import { getQuestionIcon } from "@/lib/questionIcons";
import { FormResponse, Question, QuestionType } from "@/lib/types";

type SaveStatus = "idle" | "saving" | "saved" | "error";

function mergeQuestionPatches(
  current: QuestionUpdatePayload,
  next: QuestionUpdatePayload
): QuestionUpdatePayload {
  return {
    ...current,
    ...next,
    ...(current.config || next.config
      ? { config: { ...current.config, ...next.config } }
      : {}),
  };
}

function describeError(error: unknown): string {
  return error instanceof Error ? error.message : "Please try again.";
}

export default function FormEditPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const queryClient = useQueryClient();

  const [form, setForm] = useState<FormResponse | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<BuilderTab>("create");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [typePickerOpen, setTypePickerOpen] = useState(false);
  const [publishModalOpen, setPublishModalOpen] = useState(false);

  const questionsRef = useRef(questions);
  questionsRef.current = questions;
  const pendingQuestionUpdates = useRef(new Map<string, QuestionUpdatePayload>());
  const pendingFormUpdate = useRef<{ title?: string }>({});
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveQueue = useRef<Promise<void>>(Promise.resolve());
  const saveError = useRef<unknown>(null);

  const formQuery = useQuery({
    queryKey: ["form", id],
    queryFn: () => api.getForm(id),
    enabled: Boolean(id),
  });
  const questionsQuery = useQuery({
    queryKey: ["questions", id],
    queryFn: () => api.getQuestions(id),
    enabled: Boolean(id),
  });

  useEffect(() => {
    if (formQuery.data) {
      setForm((current) =>
        current?.id === formQuery.data.id ? current : formQuery.data
      );
    }
  }, [formQuery.data]);

  useEffect(() => {
    if (!questionsQuery.data) return;
    const sortedQuestions = [...questionsQuery.data].sort(
      (a, b) => a.position - b.position
    );
    setQuestions(sortedQuestions);
    setSelectedQuestionId((current) =>
      current && sortedQuestions.some((question) => question.id === current)
        ? current
        : sortedQuestions[0]?.id ?? null
    );
  }, [questionsQuery.data]);

  const setQuestionList = useCallback(
    (nextQuestions: Question[]) => {
      const sorted = [...nextQuestions].sort((a, b) => a.position - b.position);
      questionsRef.current = sorted;
      setQuestions(sorted);
      queryClient.setQueryData<Question[]>(["questions", id], sorted);
    },
    [id, queryClient]
  );

  const flushPendingChanges = useCallback((): Promise<void> => {
    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
      saveTimer.current = null;
    }

    const formPatch = pendingFormUpdate.current;
    pendingFormUpdate.current = {};
    const questionPatches = Array.from(pendingQuestionUpdates.current.entries());
    pendingQuestionUpdates.current.clear();

    if (!Object.keys(formPatch).length && !questionPatches.length) {
      return saveQueue.current.then(() => {
        if (saveError.current) throw saveError.current;
      });
    }

    setSaveStatus("saving");
    const saveBatch = async () => {
      await Promise.all([
        Object.keys(formPatch).length
          ? api.updateForm(id, formPatch).then((updatedForm) => {
              queryClient.setQueryData<FormResponse>(["form", id], updatedForm);
            })
          : Promise.resolve(),
        ...questionPatches.map(([questionId, patch]) =>
          api.updateQuestion(id, questionId, patch).then(() => undefined)
        ),
      ]);
      saveError.current = null;
      if (
        pendingFormUpdate.current.title === undefined &&
        pendingQuestionUpdates.current.size === 0 &&
        saveTimer.current === null
      ) {
        setSaveStatus("saved");
      }
    };

    const queuedSave = saveQueue.current.catch(() => undefined).then(saveBatch);
    saveQueue.current = queuedSave;

    return queuedSave.catch((error: unknown) => {
      saveError.current = error;
      setSaveStatus("error");
      toast.error("Failed to save changes", { description: describeError(error) });
      throw error;
    });
  }, [id, queryClient]);

  const scheduleSave = useCallback(() => {
    saveError.current = null;
    setSaveStatus("saving");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveTimer.current = null;
      void flushPendingChanges().catch(() => undefined);
    }, 800);
  }, [flushPendingChanges]);

  useEffect(
    () => () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      void flushPendingChanges().catch(() => undefined);
    },
    [flushPendingChanges]
  );

  const updateFormTitle = useCallback(
    (title: string) => {
      setForm((current) => (current ? { ...current, title } : current));
      pendingFormUpdate.current = { ...pendingFormUpdate.current, title };
      scheduleSave();
    },
    [scheduleSave]
  );

  const updateQuestion = useCallback(
    (questionId: string, patch: Partial<Question>) => {
      const apiPatch: QuestionUpdatePayload = {
        ...(patch.title !== undefined ? { title: patch.title } : {}),
        ...(patch.description !== undefined ? { description: patch.description } : {}),
        ...(patch.required !== undefined ? { required: patch.required } : {}),
        ...(patch.config !== undefined ? { config: patch.config } : {}),
      };
      setQuestionList(
        questionsRef.current.map((question) =>
          question.id === questionId
            ? {
                ...question,
                ...patch,
                config: patch.config
                  ? { ...question.config, ...patch.config }
                  : question.config,
              }
            : question
        )
      );
      pendingQuestionUpdates.current.set(
        questionId,
        mergeQuestionPatches(
          pendingQuestionUpdates.current.get(questionId) ?? {},
          apiPatch
        )
      );
      scheduleSave();
    },
    [scheduleSave, setQuestionList]
  );

  const createQuestionMutation = useMutation({
    mutationFn: async (type: QuestionType) => {
      const currentQuestions = [...questionsRef.current].sort(
        (a, b) => a.position - b.position
      );
      const selectedIndex = currentQuestions.findIndex(
        (question) => question.id === selectedQuestionId
      );
      const insertAt = selectedIndex < 0 ? currentQuestions.length : selectedIndex + 1;
      const definition = QUESTION_REGISTRY[type];
      const config = {
        ...definition.defaultConfig,
        ...(definition.defaultConfig.options
          ? { options: [...definition.defaultConfig.options] }
          : {}),
      };
      const created = await api.createQuestion(id, {
        type,
        title: `Untitled ${definition.label.toLowerCase()} question`,
        position: currentQuestions.length,
        required: false,
        config,
      });
      const orderedIds = currentQuestions.map((question) => question.id);
      orderedIds.splice(insertAt, 0, created.id);
      const orderedQuestions = await api.reorderQuestions(id, {
        question_ids: orderedIds,
      });
      return { created, orderedQuestions };
    },
    onSuccess: ({ created, orderedQuestions }) => {
      setQuestionList(orderedQuestions);
      setSelectedQuestionId(created.id);
      setTypePickerOpen(false);
    },
    onError: (error) => {
      toast.error("Could not add question", { description: describeError(error) });
      void queryClient.invalidateQueries({ queryKey: ["questions", id] });
    },
  });

  const duplicateQuestionMutation = useMutation({
    mutationFn: async (questionId: string) => {
      await flushPendingChanges();
      const currentQuestions = [...questionsRef.current].sort(
        (a, b) => a.position - b.position
      );
      const duplicate = await api.duplicateQuestion(id, questionId);
      const insertAt =
        currentQuestions.findIndex((question) => question.id === questionId) + 1;
      const orderedIds = currentQuestions.map((question) => question.id);
      orderedIds.splice(insertAt, 0, duplicate.id);
      const orderedQuestions = await api.reorderQuestions(id, {
        question_ids: orderedIds,
      });
      return { duplicate, orderedQuestions };
    },
    onSuccess: ({ duplicate, orderedQuestions }) => {
      setQuestionList(orderedQuestions);
      setSelectedQuestionId(duplicate.id);
    },
    onError: (error) => {
      toast.error("Could not duplicate question", {
        description: describeError(error),
      });
      void queryClient.invalidateQueries({ queryKey: ["questions", id] });
    },
  });

  const deleteQuestionMutation = useMutation({
    mutationFn: async (questionId: string) => {
      pendingQuestionUpdates.current.delete(questionId);
      await flushPendingChanges().catch(() => undefined);
      return api.deleteQuestion(id, questionId);
    },
    onSuccess: (_result, deletedId) => {
      const remaining = questionsRef.current
        .filter((question) => question.id !== deletedId)
        .map((question, position) => ({ ...question, position }));
      setQuestionList(remaining);
      if (selectedQuestionId === deletedId) {
        setSelectedQuestionId(remaining[0]?.id ?? null);
      }
    },
    onError: (error) => {
      toast.error("Could not delete question", {
        description: describeError(error),
      });
    },
  });

  const reorderQuestionsMutation = useMutation<
    Question[],
    Error,
    string[],
    { previousQuestions: Question[] }
  >({
    mutationFn: (questionIds) =>
      api.reorderQuestions(id, { question_ids: questionIds }),
    onMutate: (questionIds) => {
      const previousQuestions = questionsRef.current;
      const questionsById = new Map(
        previousQuestions.map((question) => [question.id, question])
      );
      const optimisticQuestions = questionIds
        .map((questionId) => questionsById.get(questionId))
        .filter((question): question is Question => question !== undefined)
        .map((question, position) => ({ ...question, position }));
      setQuestionList(optimisticQuestions);
      return { previousQuestions };
    },
    onSuccess: (reorderedQuestions) => {
      setQuestionList(reorderedQuestions);
    },
    onError: (error, _questionIds, context) => {
      if (context) setQuestionList(context.previousQuestions);
      toast.error("Could not reorder questions", {
        description: describeError(error),
      });
    },
  });

  const publishMutation = useMutation({
    mutationFn: () => api.publishForm(id),
    onSuccess: (publishedForm) => {
      setForm(publishedForm);
      queryClient.setQueryData(["form", id], publishedForm);
      toast.success("Form published");
    },
    onError: (error) => {
      toast.error("Could not publish form", { description: describeError(error) });
    },
  });

  const selectedQuestion = useMemo(
    () => questions.find((question) => question.id === selectedQuestionId) ?? null,
    [questions, selectedQuestionId]
  );
  const selectedIndex = selectedQuestion
    ? questions.findIndex((question) => question.id === selectedQuestion.id)
    : -1;

  const openPublishModal = () => {
    if (questions.length === 0) {
      toast.error("Add at least one question before publishing");
      return;
    }
    setPublishModalOpen(true);
  };

  const confirmPublish = async () => {
    try {
      await flushPendingChanges();
      await publishMutation.mutateAsync();
    } catch {
      // The save and publish mutations display their own error notifications.
    }
  };

  const copyShareLink = async () => {
    const shareLink = `${window.location.origin}/f/${form?.slug ?? ""}`;
    try {
      await navigator.clipboard.writeText(shareLink);
      toast.success("Share link copied");
    } catch (error) {
      toast.error("Could not copy share link", { description: describeError(error) });
    }
  };

  const queryError = formQuery.error ?? questionsQuery.error;
  const isLoading =
    formQuery.isLoading ||
    questionsQuery.isLoading ||
    (!form && !queryError) ||
    Boolean(
      questionsQuery.data?.length &&
        questions.length === 0 &&
        !questionsQuery.error
    );

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-[#fbfbfb]" aria-label="Loading form">
        <div className="h-14 border-b border-gray-200 bg-white animate-pulse" />
        <div className="flex flex-1 min-h-0">
          <div className="w-64 border-r border-gray-200 p-4 space-y-4">
            <div className="h-3 w-24 rounded bg-gray-200 animate-pulse" />
            {[0, 1, 2, 3].map((item) => (
              <div key={item} className="h-12 rounded-lg bg-gray-100 animate-pulse" />
            ))}
          </div>
          <div className="flex-1 flex items-center justify-center">
            <div className="w-full max-w-xl space-y-5 px-8">
              <div className="h-4 w-28 rounded bg-gray-200 animate-pulse" />
              <div className="h-10 w-4/5 rounded bg-gray-200 animate-pulse" />
              <div className="h-24 rounded-xl bg-gray-100 animate-pulse" />
            </div>
          </div>
          <div className="hidden lg:block w-72 border-l border-gray-200 bg-white animate-pulse" />
        </div>
      </div>
    );
  }

  if (queryError || !form) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-3 bg-[#fbfbfb] p-6 text-center">
        <h1 className="text-lg font-semibold text-gray-900">Could not load this form</h1>
        <p className="text-sm text-gray-500">
          {queryError ? describeError(queryError) : "The form was not found."}
        </p>
        <button
          type="button"
          onClick={() => {
            void Promise.all([formQuery.refetch(), questionsQuery.refetch()]);
          }}
          className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
        >
          Try again
        </button>
      </main>
    );
  }

  const shareLink = `${typeof window === "undefined" ? "" : window.location.origin}/f/${form.slug}`;

  return (
    <div className="min-h-screen h-screen flex flex-col overflow-hidden bg-[#fbfbfb] text-[#262626]">
      <BuilderTopBar
        form={form}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        saveStatus={saveStatus}
        onPublish={openPublishModal}
        onTitleChange={updateFormTitle}
      />

      {activeTab !== "create" ? (
        <main className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
          <p className="text-lg font-semibold text-gray-700">
            {activeTab === "design" ? "Design" : "Settings"}
          </p>
          <p className="text-sm text-gray-400">Coming soon</p>
        </main>
      ) : (
        <main className="flex flex-1 min-h-0">
          <BuilderLeftPanel
            questions={questions}
            selectedId={selectedQuestionId}
            onSelect={setSelectedQuestionId}
            onAddQuestion={() => setTypePickerOpen(true)}
            onDelete={(question) => {
              if (window.confirm(`Delete "${question.title}"? This cannot be undone.`)) {
                deleteQuestionMutation.mutate(question.id);
              }
            }}
            onDuplicate={(questionId) =>
              duplicateQuestionMutation.mutate(questionId)
            }
            onReorder={(questionIds) =>
              reorderQuestionsMutation.mutate(questionIds)
            }
            busy={
              deleteQuestionMutation.isPending ||
              duplicateQuestionMutation.isPending ||
              reorderQuestionsMutation.isPending
            }
          />
          <BuilderCanvas
            question={selectedQuestion}
            questionIndex={selectedIndex}
            onTitleChange={(title) =>
              selectedQuestion && updateQuestion(selectedQuestion.id, { title })
            }
            onDescriptionChange={(description) =>
              selectedQuestion &&
              updateQuestion(selectedQuestion.id, { description })
            }
          />
          <BuilderRightPanel
            question={selectedQuestion}
            onUpdateQuestion={(patch) =>
              selectedQuestion && updateQuestion(selectedQuestion.id, patch)
            }
          />
        </main>
      )}

      {typePickerOpen && (
        <div
          className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 p-4"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setTypePickerOpen(false);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="question-type-title"
            className="w-full max-w-xl rounded-2xl bg-white p-5 shadow-xl"
          >
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 id="question-type-title" className="text-lg font-semibold text-gray-900">
                  Choose a question type
                </h2>
                <p className="mt-1 text-sm text-gray-500">Choose what people will answer.</p>
              </div>
              <button
                type="button"
                aria-label="Close question type picker"
                onClick={() => setTypePickerOpen(false)}
                className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {Object.values(QUESTION_REGISTRY).map((definition) => {
                const Icon = getQuestionIcon(definition.type);
                return (
                  <button
                    key={definition.type}
                    type="button"
                    disabled={createQuestionMutation.isPending}
                    onClick={() => createQuestionMutation.mutate(definition.type)}
                    className="flex items-start gap-3 rounded-xl border border-gray-200 p-3 text-left hover:border-purple-300 hover:bg-purple-50 disabled:opacity-50"
                  >
                    {createQuestionMutation.isPending &&
                    createQuestionMutation.variables === definition.type ? (
                      <Loader2 className="mt-0.5 h-4 w-4 animate-spin text-purple-600" />
                    ) : (
                      <Icon className="mt-0.5 h-4 w-4 text-purple-600" />
                    )}
                    <span>
                      <span className="block text-sm font-medium text-gray-900">
                        {definition.label}
                      </span>
                      <span className="mt-0.5 block text-xs text-gray-500">
                        {definition.description}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        </div>
      )}

      {publishModalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="publish-title"
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="publish-title" className="text-lg font-semibold text-gray-900">
                  {form.status === "published" ? "Your form is published" : "Publish your form"}
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Share this link with people who should respond.
                </p>
              </div>
              <button
                type="button"
                aria-label="Close publish dialog"
                onClick={() => setPublishModalOpen(false)}
                className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-5 flex gap-2">
              <input
                readOnly
                value={shareLink}
                aria-label="Public form link"
                className="min-w-0 flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700"
              />
              <button
                type="button"
                onClick={() => void copyShareLink()}
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <Copy className="h-3.5 w-3.5" />
                Copy
              </button>
            </div>
            {form.status !== "published" && (
              <button
                type="button"
                disabled={publishMutation.isPending}
                onClick={() => void confirmPublish()}
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-60"
              >
                {publishMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                {publishMutation.isPending ? "Publishing..." : "Publish form"}
              </button>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
