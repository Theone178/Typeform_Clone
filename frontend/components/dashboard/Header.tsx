"use client";

import React from "react";
import Link from "next/link";
import { Sparkles, HelpCircle, Bell } from "lucide-react";

export const Header: React.FC = () => {
  return (
    <header className="h-14 border-b border-gray-200 bg-white px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Left: Brand & Breadcrumb */}
      <div className="flex items-center gap-3">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-gray-900 text-white flex items-center justify-center font-bold text-sm tracking-tighter group-hover:bg-purple-600 transition-colors">
            T
          </div>
          <span className="font-bold text-base tracking-tight text-gray-900 hidden sm:inline">
            Typeform
          </span>
        </Link>

        <span className="text-gray-300 hidden sm:inline">/</span>

        <span className="text-sm font-medium text-gray-600 hidden sm:inline">
          My workspace
        </span>
      </div>

      {/* Right: Actions & User Avatar */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg transition-colors"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
        </button>

        <a
          href="/docs"
          target="_blank"
          className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg transition-colors hidden sm:block"
          title="Documentation"
        >
          <HelpCircle className="w-4 h-4" />
        </a>

        {/* Logged in creator avatar */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-gray-200">
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-500 text-white flex items-center justify-center text-xs font-bold shadow-xs">
              AR
            </div>
            <span
              className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white"
              title="Online"
            />
          </div>
          <div className="hidden lg:block text-left leading-tight">
            <p className="text-xs font-semibold text-gray-800">Aaditya Rajput</p>
            <p className="text-[10px] text-gray-400">Creator</p>
          </div>
        </div>
      </div>
    </header>
  );
};
