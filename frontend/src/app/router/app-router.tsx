import { createBrowserRouter, RouterProvider } from "react-router";

import { AiAssistantPage } from "../../pages/ai/ai-assistant-page";
import { LoginPage } from "../../pages/auth/login-page";
import { RegisterPage } from "../../pages/auth/register-page";
import { CompaniesPage } from "../../pages/companies/companies-page";
import { DashboardPage } from "../../pages/dashboard/dashboard-page";
import { ResourcePlaceholderPage } from "../../pages/dashboard/resource-placeholder-page";
import { NotFoundPage } from "../../pages/not-found/not-found-page";
import { DashboardLayout } from "../../widgets/layout/dashboard-layout";
import { ProtectedRoute } from "./protected-route";

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
            element: <ResourcePlaceholderPage title="Contacts" />,
          },
          {
            path: "/leads",
            element: <ResourcePlaceholderPage title="Leads" />,
          },
          {
            path: "/ai",
            element: <AiAssistantPage />,
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
