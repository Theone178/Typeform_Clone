"use client";

import React from "react";
import {
  Folder,
  Layers,
  Puzzle,
  Users,
  Settings,
  Plus,
  Sparkles,
} from "lucide-react";

interface SidebarProps {
  formsCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ formsCount }) => {
  return (
    <aside className="w-64 border-r border-gray-200 bg-white flex flex-col justify-between select-none hidden md:flex min-h-[calc(100vh-3.5rem)]">
      <div className="p-4 space-y-6">
        {/* Workspace Selector */}
        <div>
          <div className="flex items-center justify-between px-2 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
              Workspaces
            </span>
            <button
              type="button"
              className="text-gray-400 hover:text-gray-600 transition-colors p-0.5 rounded"
              title="Add workspace"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-1">
            <button
              type="button"
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium bg-gray-100/80 text-gray-900 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <Folder className="w-4 h-4 text-purple-600" />
                <span>My workspace</span>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white text-gray-600 border border-gray-200/70 shadow-2xs">
                {formsCount}
              </span>
            </button>
          </div>
        </div>

        {/* Coming Soon Sections */}
        <div>
          <div className="px-2 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
              Features
            </span>
          </div>

          <div className="space-y-1">
            {/* Integrations */}
            <div
              className="flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium text-gray-400 cursor-not-allowed hover:bg-gray-50/50 transition-colors"
              title="Coming Soon"
            >
              <div className="flex items-center gap-2.5">
                <Puzzle className="w-4 h-4 text-gray-400" />
                <span>Integrations</span>
              </div>
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200/50">
                Soon
              </span>
            </div>

            {/* Team / Collaboration */}
            <div
              className="flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium text-gray-400 cursor-not-allowed hover:bg-gray-50/50 transition-colors"
              title="Coming Soon"
            >
              <div className="flex items-center gap-2.5">
                <Users className="w-4 h-4 text-gray-400" />
                <span>Team & Members</span>
              </div>
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200/50">
                Soon
              </span>
            </div>

            {/* Custom Domains */}
            <div
              className="flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium text-gray-400 cursor-not-allowed hover:bg-gray-50/50 transition-colors"
              title="Coming Soon"
            >
              <div className="flex items-center gap-2.5">
                <Layers className="w-4 h-4 text-gray-400" />
                <span>Custom Domains</span>
              </div>
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200/50">
                Soon
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Branding / Pro badge */}
      <div className="p-4 border-t border-gray-100">
        <div className="p-3 rounded-xl bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-100/80 space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-purple-900">
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            <span>Typeform Clone</span>
          </div>
          <p className="text-[11px] text-purple-700/80 leading-snug">
            FastAPI + Next.js paired full-stack architecture.
          </p>
        </div>
      </div>
    </aside>
  );
};
