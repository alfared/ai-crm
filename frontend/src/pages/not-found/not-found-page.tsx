import { Link } from "react-router";

export function NotFoundPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <p className="text-sm font-semibold text-blue-600">404</p>

      <h1 className="mt-2 text-4xl font-bold text-slate-900">Page not found</h1>

      <Link
        to="/"
        className="mt-6 rounded-lg bg-slate-900 px-5 py-3 text-sm font-medium text-white"
      >
        Go to dashboard
      </Link>
    </main>
  );
}
