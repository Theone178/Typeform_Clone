import React from "react";
import {
  AlignLeft,
  AlignJustify,
  CheckSquare,
  ChevronDown,
  Mail,
  Hash,
  ToggleLeft,
  Star,
  LucideIcon,
} from "lucide-react";
import { QuestionType } from "./types";

const ICON_MAP: Record<QuestionType, LucideIcon> = {
  short_text: AlignLeft,
  long_text: AlignJustify,
  multiple_choice: CheckSquare,
  dropdown: ChevronDown,
  email: Mail,
  number: Hash,
  yes_no: ToggleLeft,
  rating: Star,
};

export function getQuestionIcon(type: QuestionType): LucideIcon {
  return ICON_MAP[type] ?? AlignLeft;
}

interface QuestionIconProps {
  type: QuestionType;
  className?: string;
}

export const QuestionIcon: React.FC<QuestionIconProps> = ({
  type,
  className = "w-4 h-4",
}) => {
  const Icon = getQuestionIcon(type);
  return <Icon className={className} />;
};
