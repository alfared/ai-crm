import axios from "axios";

type ApiErrorResponse = {
  message?: string | string[];
  error?: string;
  statusCode?: number;
};

export function getApiErrorMessage(
  error: unknown,
  fallback = "Something went wrong",
): string {
  if (!axios.isAxiosError<ApiErrorResponse>(error)) {
    return fallback;
  }

  const response = error.response?.data.message;

  if (Array.isArray(response)) {
    return response.join(", ");
  }

  if (typeof response === "string") {
    return response;
  }

  return error.response?.data.error ?? fallback;
}
