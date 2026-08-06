import { Navigate, Outlet, useLocation } from "react-router";

import { tokenStorage } from "../../shared/lib/auth/token-storage";

export function ProtectedRoute() {
  const location = useLocation();

  if (!tokenStorage.exists()) {
    return (
      <Navigate
        to="/login"
        state={{
          from: location.pathname,
        }}
      />
    );
  }

  return <Outlet />;
}
