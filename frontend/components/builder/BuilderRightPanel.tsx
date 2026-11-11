"use client";

import React from "react";
import { Plus, X, GripVertical } from "lucide-react";
import { Question, QuestionConfig } from "@/lib/types";
import { cn } from "@/lib/utils";

interface BuilderRightPanelProps {
  question: Question | null;
  onUpdateQuestion: (patch: Partial<Question>) => void;
}

export const BuilderRightPanel: React.FC<BuilderRightPanelProps> = ({
  question,
  onUpdateQuestion,
}) => {
  if (!question) {
    return (
      <aside className="w-72 border-l border-gray-200 bg-white shrink-0 flex items-center justify-center">
        <p className="text-xs text-gray-400 text-center px-6">
          Select a question to see its settings
        </p>
      </aside>
    );
  }

  return (
    <aside className="w-72 border-l border-gray-200 bg-white shrink-0 overflow-y-auto">
      <div className="p-4 border-b border-gray-100">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Question Settings
        </span>
      </div>
      <div className="p-4 space-y-5">
        <SettingRow label="Description" vertical>
          <textarea
            value={question.description ?? ""}
            onChange={(event) =>
              onUpdateQuestion({ description: event.target.value })
            }
            placeholder="Add a description (optional)"
            rows={3}
            className="w-full resize-y border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-100 transition-colors"
          />
        </SettingRow>

        {/* Required Toggle */}
        <SettingRow label="Required">
          <Toggle
            value={question.required}
            onChange={(v) => onUpdateQuestion({ required: v })}
          />
        </SettingRow>

        {/* Type-specific settings */}
        <TypeSpecificSettings question={question} onUpdate={onUpdateQuestion} />
      </div>
    </aside>
  );
};

/* ------------------------------------------------------------------ */
/* Sub-components                                                        */
/* ------------------------------------------------------------------ */

const SettingRow: React.FC<{
  label: string;
  children: React.ReactNode;
  vertical?: boolean;
}> = ({ label, children, vertical }) => (
  <div className={cn("flex", vertical ? "flex-col gap-2" : "items-center justify-between gap-3")}>
    <span className="text-sm font-medium text-gray-700 shrink-0">{label}</span>
    {children}
  </div>
);

const Toggle: React.FC<{ value: boolean; onChange: (v: boolean) => void }> = ({
  value,
  onChange,
}) => (
  <button
    type="button"
    onClick={() => onChange(!value)}
    className={cn(
      "relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 transition-colors focus:outline-none",
      value ? "bg-purple-600 border-purple-600" : "bg-gray-200 border-gray-200"
    )}
  >
    <span
      className={cn(
        "inline-block h-3.5 w-3.5 rounded-full bg-white shadow transform transition-transform mt-px",
        value ? "translate-x-4" : "translate-x-0.5"
      )}
    />
  </button>
);

const TextInput: React.FC<{
  value: string;
  placeholder?: string;
  onChange: (v: string) => void;
  type?: string;
}> = ({ value, placeholder, onChange, type = "text" }) => (
  <input
    type={type}
    value={value}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-800 focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-100 transition-colors"
  />
);

/** Type-specific settings panel */
const TypeSpecificSettings: React.FC<{
  question: Question;
  onUpdate: (patch: Partial<Question>) => void;
}> = ({ question, onUpdate }) => {
  const config = question.config || {};
  const patchConfig = (patch: Partial<QuestionConfig>) =>
    onUpdate({ config: { ...config, ...patch } });

  switch (question.type) {
    case "short_text":
    case "long_text":
    case "email":
      return (
        <SettingRow label="Placeholder" vertical>
          <TextInput
            value={config.placeholder ?? ""}
            placeholder="Placeholder text..."
            onChange={(v) => patchConfig({ placeholder: v })}
          />
        </SettingRow>
      );

    case "number":
      return (
        <>
          <SettingRow label="Placeholder" vertical>
            <TextInput
              value={config.placeholder ?? ""}
              placeholder="e.g. 42"
              onChange={(v) => patchConfig({ placeholder: v })}
            />
          </SettingRow>
          <SettingRow label="Min value" vertical>
            <TextInput
              type="number"
              value={config.min !== undefined ? String(config.min) : ""}
              placeholder="No minimum"
              onChange={(v) =>
                patchConfig({ min: v === "" ? undefined : Number(v) })
              }
            />
          </SettingRow>
          <SettingRow label="Max value" vertical>
            <TextInput
              type="number"
              value={config.max !== undefined ? String(config.max) : ""}
              placeholder="No maximum"
              onChange={(v) =>
                patchConfig({ max: v === "" ? undefined : Number(v) })
              }
            />
          </SettingRow>
        </>
      );

    case "rating":
      return (
        <SettingRow label="Scale" vertical>
          <div className="flex gap-1 flex-wrap">
            {[3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => patchConfig({ rating_scale: n })}
                className={cn(
                  "w-8 h-8 rounded-lg text-sm font-semibold border transition-all",
                  (config.rating_scale ?? 5) === n
                    ? "bg-purple-600 text-white border-purple-600"
                    : "bg-gray-50 text-gray-600 border-gray-200 hover:border-purple-300"
                )}
              >
                {n}
              </button>
            ))}
          </div>
        </SettingRow>
      );

    case "yes_no":
      return (
        <p className="text-xs text-gray-400 italic">
          No extra settings for Yes/No questions.
        </p>
      );

    case "multiple_choice":
      return <ChoicesEditor config={config} patchConfig={patchConfig} showAllowMultiple />;

    case "dropdown":
      return <ChoicesEditor config={config} patchConfig={patchConfig} />;

    default:
      return null;
  }
};

/** Reusable choices list editor */
const ChoicesEditor: React.FC<{
  config: QuestionConfig;
  patchConfig: (patch: Partial<QuestionConfig>) => void;
  showAllowMultiple?: boolean;
}> = ({ config, patchConfig, showAllowMultiple }) => {
  const rawOptions = config.options ?? ["Option 1", "Option 2", "Option 3"];
  const options = rawOptions.map((o) => (typeof o === "string" ? o : o.label));

  const updateOption = (idx: number, val: string) => {
    const next = [...options];
    next[idx] = val;
    patchConfig({ options: next });
  };

  const addOption = () => {
    patchConfig({ options: [...options, `Option ${options.length + 1}`] });
  };

  const removeOption = (idx: number) => {
    const next = options.filter((_, i) => i !== idx);
    patchConfig({ options: next });
  };

  return (
    <div className="space-y-3">
      {showAllowMultiple && (
        <SettingRow label="Allow multiple">
          <Toggle
            value={config.allow_multiple ?? false}
            onChange={(v) => patchConfig({ allow_multiple: v })}
          />
        </SettingRow>
      )}

      <div>
        <label className="text-sm font-medium text-gray-700 block mb-2">
          Options
        </label>
        <div className="space-y-1.5">
          {options.map((opt, idx) => (
            <div key={idx} className="flex items-center gap-1.5 group">
              <GripVertical className="w-3.5 h-3.5 text-gray-300 shrink-0 cursor-grab" />
              <input
                value={opt}
                onChange={(e) => updateOption(idx, e.target.value)}
                className="flex-1 border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm text-gray-800 focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-100 transition-colors min-w-0"
              />
              <button
                type="button"
                onClick={() => removeOption(idx)}
                className="p-1 rounded hover:bg-red-50 text-gray-300 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addOption}
          className="mt-2 inline-flex items-center gap-1.5 text-xs text-purple-600 hover:text-purple-800 font-medium transition-colors"
        >
          <Plus className="w-3 h-3" />
          Add option
        </button>
      </div>
    </div>
  );
};
