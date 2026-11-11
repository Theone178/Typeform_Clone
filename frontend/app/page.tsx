"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Search,
  FileQuestion,
  Loader2,
  AlertCircle,
  RefreshCw,
  FolderOpen,
} from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";
import { FormListItem } from "@/lib/types";
import { Header } from "@/components/dashboard/Header";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { FormRow } from "@/components/dashboard/FormRow";
import { DeleteModal } from "@/components/dashboard/DeleteModal";

export default function CreatorDashboardPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft">("all");
  const [formToDelete, setFormToDelete] = useState<FormListItem | null>(null);

  // 1. Fetch Forms via TanStack Query
  const {
    data: forms = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<FormListItem[]>({
    queryKey: ["forms"],
    queryFn: api.getForms,
  });

  // 2. Create Form Mutation
  const createMutation = useMutation({
    mutationFn: () => api.createForm({ title: "My new form" }),
    onSuccess: (newForm) => {
      queryClient.invalidateQueries({ queryKey: ["forms"] });
      toast.success("Draft form created!");
      router.push(`/forms/${newForm.id}/edit`);
    },
    onError: (err: any) => {
      toast.error("Failed to create form", {
        description: err.message || "Please check backend connection",
      });
    },
  });

  // 3. Rename Form Mutation
  const renameMutation = useMutation({
    mutationFn: ({ id, title }: { id: string; title: string }) =>
      api.updateForm(id, { title }),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["forms"] });
      toast.success("Form renamed to", {
        description: `"${updated.title}"`,
      });
    },
    onError: (err: any) => {
      toast.error("Failed to rename form", {
        description: err.message,
      });
    },
  });

  // 4. Duplicate Form Mutation
  const duplicateMutation = useMutation({
    mutationFn: (id: string) => api.duplicateForm(id),
    onSuccess: (dup) => {
      queryClient.invalidateQueries({ queryKey: ["forms"] });
      toast.success("Form duplicated", {
        description: `"${dup.title}" created`,
      });
    },
    onError: (err: any) => {
      toast.error("Failed to duplicate form", {
        description: err.message,
      });
    },
  });

  // 5. Toggle Publish Mutation
  const togglePublishMutation = useMutation({
    mutationFn: ({ id, currentStatus }: { id: string; currentStatus: string }) =>
      currentStatus === "published" ? api.unpublishForm(id) : api.publishForm(id),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["forms"] });
      toast.success(
        updated.status === "published"
          ? "Form is now published!"
          : "Form unpublished to draft"
      );
    },
    onError: (err: any) => {
      toast.error("Failed to update status", {
        description: err.message,
      });
    },
  });

  // 6. Delete Form Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteForm(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forms"] });
      toast.success("Form deleted successfully");
      setFormToDelete(null);
    },
    onError: (err: any) => {
      toast.error("Failed to delete form", {
        description: err.message,
      });
    },
  });

  // Filter & Search
  const filteredForms = useMemo(() => {
    return forms.filter((f) => {
      const matchesSearch = f.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || f.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [forms, searchQuery, statusFilter]);

  return (
    <div className="min-h-screen bg-[#fbfbfb] text-[#262626] flex flex-col">
      {/* Top Bar */}
      <Header />

      {/* Main Container */}
      <div className="flex-1 flex">
        {/* Sidebar */}
        <Sidebar formsCount={forms.length} />

        {/* Content Area */}
        <main className="flex-1 p-6 sm:p-10 max-w-6xl mx-auto w-full space-y-8">
          {/* Workspace Title & Create Button */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900">
                My workspace
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                Manage your conversational forms, monitor response volume, and publish changes.
              </p>
            </div>

            <button
              type="button"
              onClick={() => createMutation.mutate()}
              disabled={createMutation.isPending}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white bg-purple-600 hover:bg-purple-700 active:scale-98 transition-all shadow-md shadow-purple-500/20 disabled:opacity-50"
            >
              {createMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              <span>Create form</span>
            </button>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search forms..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-gray-200 bg-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-500 transition-all"
              />
            </div>

            {/* Status Pills */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-gray-100/80 border border-gray-200/60 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setStatusFilter("all")}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  statusFilter === "all"
                    ? "bg-white text-gray-900 shadow-2xs"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                All ({forms.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("published")}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  statusFilter === "published"
                    ? "bg-white text-gray-900 shadow-2xs"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                Published
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("draft")}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  statusFilter === "draft"
                    ? "bg-white text-gray-900 shadow-2xs"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                Drafts
              </button>
            </div>
          </div>

          {/* Forms List Content */}
          <div className="space-y-3">
            {/* 1. Loading Skeletons */}
            {isLoading && (
              <div className="space-y-3">
                {[1, 2, 3].map((n) => (
                  <div
                    key={n}
                    className="flex items-center justify-between p-5 rounded-2xl bg-white border border-gray-200/70 animate-pulse"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-gray-200/70" />
                      <div className="space-y-2">
                        <div className="w-48 h-4 rounded-md bg-gray-200/70" />
                        <div className="w-24 h-3 rounded-md bg-gray-200/50" />
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-6 rounded-full bg-gray-200/60" />
                      <div className="w-8 h-8 rounded-lg bg-gray-200/50" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 2. Error State */}
            {isError && (
              <div className="p-8 rounded-2xl bg-white border border-red-200 text-center space-y-4 shadow-sm">
                <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center mx-auto">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-gray-900">Could not connect to backend</h3>
                  <p className="text-xs sm:text-sm text-gray-500 max-w-md mx-auto">
                    {(error as ApiError)?.message || "Please ensure the FastAPI server is running on http://127.0.0.1:8000"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => refetch()}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-gray-900 text-white hover:bg-gray-800 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Retry</span>
                </button>
              </div>
            )}

            {/* 3. Empty State (No Forms in Workspace) */}
            {!isLoading && !isError && forms.length === 0 && (
              <div className="p-12 rounded-3xl bg-white border border-dashed border-gray-300 text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto">
                  <FolderOpen className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-gray-900">No forms yet</h3>
                  <p className="text-sm text-gray-500 max-w-sm mx-auto">
                    Create your first conversational form in seconds and start gathering responses.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => createMutation.mutate()}
                  disabled={createMutation.isPending}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white bg-purple-600 hover:bg-purple-700 transition-colors shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create form</span>
                </button>
              </div>
            )}

            {/* 4. Empty Search Results */}
            {!isLoading && !isError && forms.length > 0 && filteredForms.length === 0 && (
              <div className="p-10 rounded-2xl bg-white border border-gray-200 text-center space-y-2">
                <FileQuestion className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <h4 className="font-semibold text-sm text-gray-900">No matching forms</h4>
                <p className="text-xs text-gray-500">
                  Try adjusting your search query or filter.
                </p>
              </div>
            )}

            {/* 5. Forms List */}
            {!isLoading && !isError && filteredForms.length > 0 && (
              <div className="space-y-2.5">
                {filteredForms.map((form) => (
                  <FormRow
                    key={form.id}
                    form={form}
                    onRename={async (id, title) => {
                      await renameMutation.mutateAsync({ id, title });
                    }}
                    onDuplicate={async (id) => {
                      await duplicateMutation.mutateAsync(id);
                    }}
                    onTogglePublish={async (id, currentStatus) => {
                      await togglePublishMutation.mutateAsync({ id, currentStatus });
                    }}
                    onOpenDelete={(f) => setFormToDelete(f)}
                  />
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteModal
        isOpen={Boolean(formToDelete)}
        formTitle={formToDelete?.title || ""}
        isDeleting={deleteMutation.isPending}
        onConfirm={() => {
          if (formToDelete) {
            deleteMutation.mutate(formToDelete.id);
          }
        }}
        onCancel={() => setFormToDelete(null)}
      />
    </div>
  );
}
