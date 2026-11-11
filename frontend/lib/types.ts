export type QuestionType =
  | "short_text"
  | "long_text"
  | "email"
  | "number"
  | "yes_no"
  | "multiple_choice"
  | "dropdown"
  | "rating";

export interface ThemeConfig {
  primary_color?: string;
  background_color?: string;
  text_color?: string;
  font?: string;
}

export interface ThankYouConfig {
  title?: string;
  message?: string;
  button_text?: string;
  button_url?: string;
}

export interface QuestionConfig {
  options?: (string | { label: string; value: string })[];
  allow_multiple?: boolean;
  rating_scale?: number;
  min?: number;
  max?: number;
  placeholder?: string;
  max_length?: number;
}

export interface Question {
  id: string;
  form_id: string;
  type: QuestionType;
  title: string;
  description?: string | null;
  required: boolean;
  position: number;
  config: QuestionConfig;
  created_at?: string;
  updated_at?: string;
}

export interface PublicForm {
  id: string;
  title: string;
  status: "draft" | "published";
  slug: string;
  theme: ThemeConfig;
  thank_you: ThankYouConfig;
  questions: Question[];
}

export interface FormListItem {
  id: string;
  title: string;
  status: "draft" | "published";
  slug: string;
  theme: ThemeConfig;
  thank_you: ThankYouConfig;
  created_at: string;
  updated_at: string;
  question_count: number;
  response_count: number;
}

export interface FormResponse {
  id: string;
  title: string;
  status: "draft" | "published";
  slug: string;
  theme: ThemeConfig;
  thank_you: ThankYouConfig;
  created_at: string;
  updated_at: string;
  questions?: Question[];
  response_count?: number;
}

export interface FormCreatePayload {
  title: string;
  slug?: string;
  theme?: ThemeConfig;
  thank_you?: ThankYouConfig;
}

export interface FormUpdatePayload {
  title?: string;
  slug?: string;
  status?: "draft" | "published";
  theme?: ThemeConfig;
  thank_you?: ThankYouConfig;
}

export interface AnswerInput {
  question_id: string;
  value: any;
}

export interface ResponseSubmitPayload {
  answers: AnswerInput[];
  started_at?: string;
  submitted_at?: string;
}

export interface AnswerResponse {
  id: string;
  question_id: string;
  value: any;
}

export interface ResponseDetail {
  id: string;
  form_id: string;
  started_at: string;
  submitted_at: string;
  duration_seconds?: number | null;
  answers: AnswerResponse[];
}

export interface OptionBreakdown {
  option: string;
  count: number;
  percentage: number;
}

export interface QuestionStats {
  question_id: string;
  title: string;
  type: QuestionType;
  position: number;
  total_answers: number;
  data: {
    options_breakdown?: OptionBreakdown[];
    recent_answers?: string[];
    average?: number | null;
    min?: number | null;
    max?: number | null;
    distribution?: Record<string, number>;
    count?: number;
  };
}

export interface FormStats {
  form_id: string;
  title: string;
  total_responses: number;
  completion_rate: number;
  average_duration_seconds?: number | null;
  questions_stats: QuestionStats[];
}

export interface ApiErrorDetail {
  question_id?: string;
  field?: string;
  error: string;
}

export interface ApiErrorResponse {
  message?: string;
  errors?: ApiErrorDetail[];
  detail?: string | { message?: string; errors?: ApiErrorDetail[] };
}
