import { Link } from "react-router";

export function RegisterPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Create account</h1>

        <p className="mt-2 text-sm text-slate-600">
          Create your workspace and owner account.
        </p>

        <div className="mt-8 rounded-xl bg-slate-100 p-4 text-sm text-slate-700">
          Registration form will be implemented in the next step.
        </div>

        <p className="mt-6 text-sm text-slate-600">
          Already registered?{" "}
          <Link
            to="/login"
            className="font-medium text-blue-600 hover:underline"
          >
            Sign in
          </Link>
        </p>
      </section>
    </main>
  );
}
