import { Suspense } from "react";
import { Navigate, Route, RouteProps, Routes } from "react-router-dom";

import AdminLayout from "@/components/layout/admin";
import AuthLayout from "@/components/layout/auth";
import routes from "@/services/routes";
import allRoutes from "@/services/routes/all_routes";
import { useAuthContext } from "@/states/auth";

const Router = (props: RouteProps) => {
  const { isLoggedIn } = useAuthContext();

  const getFilteredAdminRoutes = () => {
    return allRoutes.admin;
  };

  return (
    <Routes>
      {/* Root Path */}
      <Route
        path="/"
        element={
          isLoggedIn() ? (
            <Navigate to={routes.dashboard.index} replace />
          ) : (
            <Navigate to={routes.auth.login} replace />
          )
        }
      />

      {/* Admin routes with AdminLayout */}
      <Route>
        {getFilteredAdminRoutes().map((route, index) => (
          <Route
            key={"admin-" + index}
            path={route.path}
            element={
              isLoggedIn() ? (
                <AdminLayout {...props}>{route.element}</AdminLayout>
              ) : (
                <Navigate to={routes.auth.login} replace />
              )
            }
          />
        ))}
      </Route>

      {/* Auth routes with AuthLayout */}
      <Route>
        {allRoutes.auth.map((route, index) => (
          <Route
            key={"auth-" + index}
            path={route.path}
            element={<AuthLayout {...props}>{route.element}</AuthLayout>}
          />
        ))}
      </Route>

      {/* Other routes */}
      <Route>
        {allRoutes.other.map((route, index) => (
          <Route
            key={"other-" + index}
            path={route.path}
            element={<Suspense>{route.element}</Suspense>}
          />
        ))}
      </Route>
    </Routes>
  );
};

export default Router;
