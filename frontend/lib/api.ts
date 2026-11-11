import {
  ApiErrorDetail,
  PublicForm,
  ResponseDetail,
  ResponseSubmitPayload,
} from "./types";

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

  // Creator Endpoints (Available for builder / dashboard integration)
  getForms: () => request<any[]>("/forms"),
  getForm: (id: string) => request<any>(`/forms/${id}`),
  publishForm: (id: string) => request<any>(`/forms/${id}/publish`, { method: "POST" }),
  unpublishForm: (id: string) => request<any>(`/forms/${id}/unpublish`, { method: "POST" }),
  getFormResponses: (id: string) => request<any[]>(`/forms/${id}/responses`),
  getFormStats: (id: string) => request<any>(`/forms/${id}/stats`),
};
