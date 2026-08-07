import { createBrowserRouter, RouterProvider } from "react-router";

import { LoginPage } from "../../pages/auth/login-page";
import { RegisterPage } from "../../pages/auth/register-page";
import { CompaniesPage } from "../../pages/companies/companies-page";
import { DashboardPage } from "../../pages/dashboard/dashboard-page";
import { ResourcePlaceholderPage } from "../../pages/dashboard/resource-placeholder-page";
import { NotFoundPage } from "../../pages/not-found/not-found-page";
import { DashboardLayout } from "../../widgets/layout/dashboard-layout";
import { ProtectedRoute } from "./protected-route";
import { ContactsPage } from "../../pages/contacts/contacts-page";

const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/register",
    element: <RegisterPage />,
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          {
            path: "/",
            element: <DashboardPage />,
          },
          {
            path: "/companies",
            element: <CompaniesPage />,
          },
          {
            path: "/contacts",
            element: <ContactsPage />,
          },
          {
            path: "/leads",
            element: <ResourcePlaceholderPage title="Leads" />,
          },
        ],
      },
    ],
  },
  {
    path: "*",
    element: <NotFoundPage />,
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
