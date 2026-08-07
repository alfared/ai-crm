import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { getApiErrorMessage } from "../../shared/api/get-api-error-message";
import { getContacts } from "./contacts-api";

export function ContactsPage() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const contactsQuery = useQuery({
    queryKey: [
      "contacts",
      {
        page,
        limit: 20,
        search,
      },
    ],
    queryFn: () =>
      getContacts({
        page,
        limit: 20,
        search,
      }),
  });

  function handleSearch(): void {
    setPage(1);
    setSearch(searchInput.trim());
  }

  function handleClearSearch(): void {
    setSearchInput("");
    setSearch("");
    setPage(1);
  }

  const contacts = contactsQuery.data?.items ?? [];
  const pagination = contactsQuery.data?.pagination;

  return (
    <section>
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Contacts</h1>

          <p className="mt-2 text-slate-600">
            {pagination
              ? `${pagination.total} contacts in your workspace`
              : "Manage people connected to your companies"}
          </p>
        </div>

        <button
          type="button"
          className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          Add contact
        </button>
      </header>

      <div className="mt-8 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row">
        <input
          type="search"
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              handleSearch();
            }
          }}
          placeholder="Search by name, email, phone, job title or company"
          className="min-w-0 flex-1 rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
        />

        <button
          type="button"
          onClick={handleSearch}
          className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
        >
          Search
        </button>

        {search && (
          <button
            type="button"
            onClick={handleClearSearch}
            className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Clear
          </button>
        )}
      </div>

      {contactsQuery.isLoading && (
        <p className="mt-8 text-slate-500">Loading contacts...</p>
      )}

      {contactsQuery.isError && (
        <div className="mt-8 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
          {getApiErrorMessage(contactsQuery.error, "Failed to load contacts")}
        </div>
      )}

      {contactsQuery.isSuccess && contacts.length === 0 && (
        <div className="mt-8 rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <h2 className="font-semibold text-slate-900">No contacts found</h2>
          <p className="mt-2 text-sm text-slate-500">
            Create a contact or change the search parameters.
          </p>
        </div>
      )}

      {contactsQuery.isSuccess && contacts.length > 0 && (
        <>
          <div className="mt-8 overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                    Contact
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                    Company
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                    Job title
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                    Email
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                    Phone
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {contacts.map((contact) => (
                  <tr key={contact.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-900">
                        {contact.firstName} {contact.lastName}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {contact.company?.name ?? "—"}
                    </td>

                    <td className="px-6 py-4 text-sm text-slate-600">
                      {contact.jobTitle ?? "-"}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {contact.email ? (
                        <a
                          href={`mailto:${contact.email}`}
                          className="text-blue-600 hover:underline"
                        >
                          {contact.email}
                        </a>
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-sm text-slate-600">
                      {contact.phone ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pagination && pagination.pages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <p className="text-sm text-slate-500">
                Page {pagination.page} of {pagination.pages}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={page >= pagination.pages}
                  onClick={() =>
                    setPage((current) =>
                      Math.min(pagination.pages, current + 1),
                    )
                  }
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}
