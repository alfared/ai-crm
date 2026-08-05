import { apiClient } from "../../../shared/api/api-client";

export type LoginRequest = {
  email: string;
  password: string;
};

export type AuthResponse = {
  accessToken: string;
  tokenType: "Bearer";
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: "OWNER" | "ADMIN" | "MANAGER" | "MEMBER";
  };
  workspace: {
    id: string;
    name: string;
    slug: string;
  };
};

export async function login(payload: LoginRequest): Promise<AuthResponse> {
  const response = await apiClient.post<AuthResponse>("/auth/login", payload);

  return response.data;
}
