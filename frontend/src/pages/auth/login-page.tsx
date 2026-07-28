import { Link } from "react-router";

export function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Sign in</h1>
        <p className="mt-2 text-sm text-slate-600">
          Sign in to your AI CRM workspace
        </p>
        <div className="mt-8 rounded-xl bg-slate-100 p-4 text-sm text-slate-700">
          Login form will be implemented in the next step.
        </div>
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
