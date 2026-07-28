import { useQuery } from "@tanstack/react-query";

import { getApiErrorMessage } from "../../shared/api/get-api-error-message";
import { getHealth } from "../../shared/api/health-api";

export function DashboardPage() {
  const healthQuery = useQuery({
    queryKey: ["health"],
    queryFn: getHealth,
  });

  return (
    <section>
      <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>

      <p className="mt-2 text-slate-600">Welcome to your AI CRM workspace.</p>

      <div className="mt-8 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="font-semibold text-slate-900">API connection</h2>

        {healthQuery.isLoading && (
          <p className="mt-3 text-sm text-slate-500">
            Checking backend connection...
          </p>
        )}

        {healthQuery.isSuccess && (
          <div className="mt-3">
            <span className="inline-flex rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700">
              API connected: {healthQuery.data.status}
            </span>
          </div>
        )}

        {healthQuery.isError && (
          <p className="mt-3 text-sm text-red-600">
            {getApiErrorMessage(
              healthQuery.error,
              "Cannot connect to backend API",
            )}
          </p>
        )}
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-3">
        <article className="rounded-xl border border-slate-200 bg-white p-6">
          <p className="text-sm text-slate-500">Companies</p>
          <p className="mt-2 text-3xl font-bold">0</p>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-6">
          <p className="text-sm text-slate-500">Contacts</p>
          <p className="mt-2 text-3xl font-bold">0</p>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-6">
          <p className="text-sm text-slate-500">Leads</p>
          <p className="mt-2 text-3xl font-bold">0</p>
        </article>
      </div>
    </section>
  );
}
