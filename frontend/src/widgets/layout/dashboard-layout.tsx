import { NavLink, Outlet, useNavigate } from "react-router";
import { tokenStorage } from "../../shared/lib/auth/token-storage";

const navigation = [
  {
    label: "Dashboard",
    to: "/",
  },
  {
    label: "Companies",
    to: "/companies",
  },
  {
    label: "Contacts",
    to: "/contacts",
  },
  {
    label: "Leads",
    to: "/leads",
  },
];

export function DashboardLayout() {
  const navigate = useNavigate();

  function handleLogout(): void {
    tokenStorage.remove();

    navigate("/login", {
      replace: true,
    });
  }
  return (
    <div className="min-h-screen bg-slate-50">
      <aside className="fixed inset-y-0 left-0 w-64 border-r border-slate-200 bg-white p-6">
        <div className="text-xl font-bold text-slate-900">AI CRM</div>

        <nav className="mt-8 space-y-2">
          {navigation.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                [
                  "block rounded-lg px-4 py-3 text-sm font-medium transition",
                  isActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                ].join(" ")
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="pl-64">
        <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-8">
          <span className="text-sm text-slate-500">Workspace</span>

          <button
            type="button"
            onClick={handleLogout}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50"
          >
            User
          </button>
        </header>

        <main className="p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
