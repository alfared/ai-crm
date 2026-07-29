import { useQuery } from "@tanstack/react-query";

import { getApiErrorMessage } from "../../shared/api/get-api-error-message";
import { getCompanies } from "./companies-api";

export function CompaniesPage() {
  const companiesQuery = useQuery({
    queryKey: ["companies", { page: 1, limit: 20 }],
    queryFn: () =>
      getCompanies({
        page: 1,
        limit: 20,
      }),
  });

  if (companiesQuery.isLoading) {
    return (
      <section>
        <h1 className="text-3xl font-bold text-slate-900">Companies</h1>
        <p className="mt-6 text-slate-500">Loading companies...</p>
      </section>
    );
  }

  if (companiesQuery.isError) {
    return (
      <section>
        <h1 className="text-3xl font-bold text-slate-900">Companies</h1>
        <p className="mt-6 text-red-500">
          {getApiErrorMessage(companiesQuery.error, "Failed to load companies")}
        </p>
      </section>
    );
  }

  const companies = companiesQuery.data?.items ?? [];
  const pagination = companiesQuery.data?.pagination;

  return (
    <section>
      <header>
        <h1 className="text-3xl font-bold text-slate-900">Companies</h1>

        <p className="mt-2 text-slate-600">
          {pagination?.total} companies in your workspace
        </p>
      </header>

      {companies.length === 0 ? (
        <div className="mt-8 rounded-xl border border-slate-200 bg-slate-50 p-8 text-center">
          <p className="text-slate-500">No companies found</p>

          <p className="mt-2 text-sm text-slate-500">
            Create your first company to start managing customers.
          </p>
        </div>
      ) : (
        <div className="mt-8 overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                  Company
                </th>

                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                  Industry
                </th>

                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                  Email
                </th>

                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                  Phone
                </th>

                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                  Website
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {companies.map((company) => (
                <tr key={company.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <p className="font-medium text-slate-900">{company.name}</p>

                    {company.address && (
                      <p className="mt-1 text-sm text-slate-500">
                        {company.address}
                      </p>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {company.industry ?? "—"}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {company.email ?? "—"}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {company.phone ?? "—"}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {company.website ? (
                      <a
                        href={company.website}
                        target="_blank"
                        rel="noreferrer"
                        className="font-medium text-blue-600 hover:underline"
                      >
                        Visit
                      </a>
                    ) : (
                      <span className="text-slate-500">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
