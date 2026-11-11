import {
  ApiErrorDetail,
  FormCreatePayload,
  FormListItem,
  FormResponse,
  FormUpdatePayload,
  PublicForm,
  Question,
  ResponseDetail,
  ResponseSubmitPayload,
} from "./types";

export interface QuestionCreatePayload {
  type: string;
  title: string;
  description?: string | null;
  required?: boolean;
  position?: number;
  config?: Record<string, any>;
}

export interface QuestionUpdatePayload {
  type?: string;
  title?: string;
  description?: string | null;
  required?: boolean;
  position?: number;
  config?: Record<string, any>;
}

export interface ReorderPayload {
  question_ids: string[];
}

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") || "http://127.0.0.1:8000";

export class ApiError extends Error {
  status: number;
  errors?: ApiErrorDetail[];

  constructor(message: string, status: number, errors?: ApiErrorDetail[]) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  const headers = new Headers(options.headers || {});
  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMessage = `Request failed with status ${response.status}`;
    let errorDetails: ApiErrorDetail[] | undefined;

    try {
      const data = await response.json();
      if (typeof data.detail === "string") {
        errorMessage = data.detail;
      } else if (data.detail && typeof data.detail === "object") {
        errorMessage = data.detail.message || errorMessage;
        if (Array.isArray(data.detail.errors)) {
          errorDetails = data.detail.errors;
        }
      } else if (data.message) {
        errorMessage = data.message;
        if (Array.isArray(data.errors)) {
          errorDetails = data.errors;
        }
      }
    } catch {
      // JSON parse failed, keep generic message
    }

    throw new ApiError(errorMessage, response.status, errorDetails);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

export const api = {
  // Public Respondent Endpoints
  getPublicForm: (slug: string): Promise<PublicForm> => {
    return request<PublicForm>(`/public/forms/${encodeURIComponent(slug)}`, {
      method: "GET",
      cache: "no-store",
    });
  },

  submitFormResponse: (
    slug: string,
    payload: ResponseSubmitPayload
  ): Promise<ResponseDetail> => {
    return request<ResponseDetail>(`/public/forms/${encodeURIComponent(slug)}/responses`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  // Creator Endpoints
  getForms: (): Promise<FormListItem[]> => {
    return request<FormListItem[]>("/forms", {
      method: "GET",
      cache: "no-store",
    });
  },

  getForm: (id: string): Promise<FormResponse> => {
    return request<FormResponse>(`/forms/${id}`, {
      method: "GET",
      cache: "no-store",
    });
  },

  createForm: (payload: FormCreatePayload): Promise<FormResponse> => {
    return request<FormResponse>("/forms", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  updateForm: (id: string, payload: FormUpdatePayload): Promise<FormResponse> => {
    return request<FormResponse>(`/forms/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },

  deleteForm: (id: string): Promise<void> => {
    return request<void>(`/forms/${id}`, {
      method: "DELETE",
    });
  },

  publishForm: (id: string): Promise<FormResponse> => {
    return request<FormResponse>(`/forms/${id}/publish`, {
      method: "POST",
    });
  },

  unpublishForm: (id: string): Promise<FormResponse> => {
    return request<FormResponse>(`/forms/${id}/unpublish`, {
      method: "POST",
    });
  },

  duplicateForm: (id: string): Promise<FormResponse> => {
    return request<FormResponse>(`/forms/${id}/duplicate`, {
      method: "POST",
    });
  },

  getFormResponses: (id: string): Promise<ResponseDetail[]> => {
    return request<ResponseDetail[]>(`/forms/${id}/responses`, {
      method: "GET",
      cache: "no-store",
    });
  },

  getFormStats: (id: string): Promise<any> => {
    return request<any>(`/forms/${id}/stats`, {
      method: "GET",
      cache: "no-store",
    });
  },

  // Question CRUD
  getQuestions: (formId: string): Promise<Question[]> => {
    return request<Question[]>(`/forms/${formId}/questions`, {
      method: "GET",
      cache: "no-store",
    });
  },

  createQuestion: (
    formId: string,
    payload: QuestionCreatePayload
  ): Promise<Question> => {
    return request<Question>(`/forms/${formId}/questions`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  updateQuestion: (
    formId: string,
    questionId: string,
    payload: QuestionUpdatePayload
  ): Promise<Question> => {
    return request<Question>(`/forms/${formId}/questions/${questionId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },

  deleteQuestion: (formId: string, questionId: string): Promise<void> => {
    return request<void>(`/forms/${formId}/questions/${questionId}`, {
      method: "DELETE",
    });
  },

  reorderQuestions: (
    formId: string,
    payload: ReorderPayload
  ): Promise<Question[]> => {
    return request<Question[]>(`/forms/${formId}/questions/reorder`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  duplicateQuestion: (
    formId: string,
    questionId: string
  ): Promise<Question> => {
    return request<Question>(`/forms/${formId}/questions/${questionId}/duplicate`, {
      method: "POST",
    });
  },
};
