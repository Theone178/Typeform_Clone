import { QuestionConfig, QuestionType } from "./types";

export const QUESTION_TYPES = {
  SHORT_TEXT: "short_text" as QuestionType,
  LONG_TEXT: "long_text" as QuestionType,
  EMAIL: "email" as QuestionType,
  NUMBER: "number" as QuestionType,
  YES_NO: "yes_no" as QuestionType,
  MULTIPLE_CHOICE: "multiple_choice" as QuestionType,
  DROPDOWN: "dropdown" as QuestionType,
  RATING: "rating" as QuestionType,
} as const;

export interface QuestionTypeDefinition {
  type: QuestionType;
  label: string;
  description: string;
  placeholder?: string;
  defaultConfig: QuestionConfig;
  validate: (value: any, required: boolean, config: QuestionConfig) => string | null;
}

export function extractOptionStrings(
  options?: (string | { label: string; value: string })[]
): string[] {
  if (!options || !Array.isArray(options)) return [];
  return options.map((opt) =>
    typeof opt === "string" ? opt : opt.value ?? opt.label ?? String(opt)
  );
}

export const QUESTION_REGISTRY: Record<QuestionType, QuestionTypeDefinition> = {
  short_text: {
    type: "short_text",
    label: "Short Text",
    description: "Single-line text response",
    placeholder: "Type your answer here...",
    defaultConfig: { placeholder: "Type your answer here..." },
    validate: (value, required, config) => {
      const valStr =
        value !== undefined && value !== null ? String(value).trim() : "";
      if (required && valStr === "") return "Please fill this in";
      if (valStr && config?.max_length && valStr.length > config.max_length)
        return `Exceeds max length of ${config.max_length} characters`;
      return null;
    },
  },

  long_text: {
    type: "long_text",
    label: "Long Text",
    description: "Multi-line text response",
    placeholder: "Type your answer here...",
    defaultConfig: { placeholder: "Type your answer here..." },
    validate: (value, required, config) => {
      const valStr =
        value !== undefined && value !== null ? String(value).trim() : "";
      if (required && valStr === "") return "Please fill this in";
      if (valStr && config?.max_length && valStr.length > config.max_length)
        return `Exceeds max length of ${config.max_length} characters`;
      return null;
    },
  },

  email: {
    type: "email",
    label: "Email",
    description: "Valid email address",
    placeholder: "name@example.com",
    defaultConfig: { placeholder: "name@example.com" },
    validate: (value, required) => {
      const valStr =
        value !== undefined && value !== null ? String(value).trim() : "";
      if (required && !valStr) return "Please enter your email";
      if (valStr) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(valStr))
          return "Hmm... that doesn't look like a valid email";
      }
      return null;
    },
  },

  number: {
    type: "number",
    label: "Number",
    description: "Numeric values only",
    placeholder: "0",
    defaultConfig: {},
    validate: (value, required, config) => {
      if (required && (value === undefined || value === null || value === ""))
        return "Please enter a number";
      if (value !== undefined && value !== null && value !== "") {
        const num = Number(value);
        if (isNaN(num)) return "Please enter a valid number";
        if (config?.min !== undefined && num < config.min)
          return `Number must be at least ${config.min}`;
        if (config?.max !== undefined && num > config.max)
          return `Number must be at most ${config.max}`;
      }
      return null;
    },
  },

  yes_no: {
    type: "yes_no",
    label: "Yes / No",
    description: "Simple yes or no question",
    defaultConfig: {},
    validate: (value, required) => {
      if (required && (value === undefined || value === null || value === ""))
        return "Please choose Yes or No";
      if (value !== undefined && value !== null && value !== "") {
        const v = String(value).toLowerCase();
        if (!["yes", "no"].includes(v)) return "Please choose Yes or No";
      }
      return null;
    },
  },

  multiple_choice: {
    type: "multiple_choice",
    label: "Multiple Choice",
    description: "Single or multi-select options",
    defaultConfig: {
      options: ["Option 1", "Option 2", "Option 3"],
      allow_multiple: false,
    },
    validate: (value, required, config) => {
      const allowMultiple = config?.allow_multiple ?? true;

      if (allowMultiple) {
        // Multi-select: value is an array
        const selected: string[] = Array.isArray(value)
          ? value.map((v) => String(v).trim()).filter(Boolean)
          : value !== null && value !== undefined && String(value).trim() !== ""
          ? [String(value).trim()]
          : [];
        if (required && selected.length === 0) return "Please select an option";
        if (selected.length > 0) {
          const validOptions = extractOptionStrings(config?.options);
          if (validOptions.length > 0) {
            const invalid = selected.filter((s) => !validOptions.includes(s));
            if (invalid.length > 0)
              return `Option "${invalid[0]}" is not allowed`;
          }
        }
      } else {
        // Single-select: value is a string
        const strVal =
          value !== undefined && value !== null && !Array.isArray(value)
            ? String(value).trim()
            : "";
        if (required && strVal === "") return "Please select an option";
        if (strVal !== "") {
          const validOptions = extractOptionStrings(config?.options);
          if (validOptions.length > 0 && !validOptions.includes(strVal))
            return "Selected choice is not in the allowed options";
        }
      }
      return null;
    },
  },

  dropdown: {
    type: "dropdown",
    label: "Dropdown",
    description: "Select from a dropdown menu",
    defaultConfig: { options: ["Option 1", "Option 2", "Option 3"] },
    validate: (value, required, config) => {
      const strVal =
        value !== undefined && value !== null && !Array.isArray(value)
          ? String(value).trim()
          : "";
      if (required && strVal === "") return "Please select an option";
      if (strVal !== "") {
        const validOptions = extractOptionStrings(config?.options);
        if (validOptions.length > 0 && !validOptions.includes(strVal))
          return "Selected choice is not in the allowed options";
      }
      return null;
    },
  },

  rating: {
    type: "rating",
    label: "Rating",
    description: "Star or number scale rating",
    defaultConfig: { rating_scale: 5 },
    validate: (value, required, config) => {
      if (required && (value === undefined || value === null || value === ""))
        return "Please pick a rating";
      if (value !== undefined && value !== null && value !== "") {
        const num = Number(value);
        const max = config?.rating_scale ?? config?.max ?? 5;
        if (isNaN(num) || num < 1 || num > max)
          return `Rating must be between 1 and ${max}`;
      }
      return null;
    },
  },
};

export function getQuestionTypeDefinition(
  type: QuestionType | string
): QuestionTypeDefinition {
  const normalized = (type || "short_text").toLowerCase() as QuestionType;
  return QUESTION_REGISTRY[normalized] || QUESTION_REGISTRY.short_text;
}
