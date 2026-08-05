import { type FormEvent, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router";

import { login, type LoginRequest } from "../../features/auth/api/auth-api";
import { getApiErrorMessage } from "../../shared/api/get-api-error-message";
import { tokenStorage } from "../../shared/lib/auth/token-storage";

export function LoginPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState<LoginRequest>({
    email: "",
    password: "",
  });

  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (tokenStorage.exists()) {
    return <Navigate to="/" replace />;
  }

  function updateField(field: keyof LoginRequest, value: string): void {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const response = await login({
        email: form.email.trim(),
        password: form.password,
      });

      tokenStorage.set(response.accessToken);

      navigate("/", {
        replace: true,
      });
    } catch (error: unknown) {
      setErrorMessage(getApiErrorMessage(error, "Unable to sign in"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Sign in</h1>

        <p className="mt-2 text-sm text-slate-600">
          Sign in to your AI CRM workspace
        </p>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Email
            </label>

            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={form.email}
              onChange={(event) => updateField("email", event.target.value)}
              placeholder="demo@ai-crm.app"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Password
            </label>

            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              minLength={8}
              value={form.password}
              onChange={(event) => updateField("password", event.target.value)}
              placeholder="Enter your password"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </div>

          {errorMessage && (
            <div
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
            >
              {errorMessage}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
          >
            {isSubmitting ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-sm text-slate-600">
          Don&apos;t have an account?{" "}
          <Link
            to="/register"
            className="font-medium text-blue-600 hover:underline"
          >
            Create account
          </Link>
        </p>
      </section>
    </main>
  );
}
