const ACCESS_TOKEN_KEY = "ai_crm_access_token";

export const tokenStorage = {
  get(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  },

  set(token: string): void {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
  },

  remove(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
  },

  exists(): boolean {
    return Boolean(localStorage.getItem(ACCESS_TOKEN_KEY));
  },
};
