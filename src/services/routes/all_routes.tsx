import { lazy } from "react";
import { RouteProps } from "react-router-dom";

export type RoutesProps = {
  path: RouteProps["path"];
  name?: string;
  element?: RouteProps["element"];
  children?: RoutesProps[];
};

// Component Wrapper
const cw = (Component: any) => {
  return <Component />;
};

const dashboardRoutes: RoutesProps[] = [
  {
    path: "/dashboard",
    name: "dashboard",
    element: cw(lazy(() => import("@/pages/admin/dashboard/dashboard"))),
  },
];

const adminToolsRoutes: RoutesProps[] = [
  {
    path: "/admin-tools/users",
    name: "admin-tools.users",
    element: cw(lazy(() => import("@/pages/admin/adminTools/users"))),
  },
];

const authRoutes: RoutesProps[] = [
  {
    path: "/auth/login",
    name: "auth.login",
    element: cw(lazy(() => import("@/pages/auth/login"))),
  },
  {
    path: "/auth/register",
    name: "auth.register",
    element: cw(lazy(() => import("@/pages/auth/register"))),
  },
  {
    path: "/auth/forgot-password",
    name: "auth.forgot-password",
    element: cw(lazy(() => import("@/pages/auth/forgot-password"))),
  },
  {
    path: "/auth/reset-password",
    name: "auth.reset-password",
    element: cw(lazy(() => import("@/pages/auth/reset-password"))),
  },
];

const otherRoutes: RoutesProps[] = [
  {
    path: "/:path",
    name: "Not Found",
    element: cw(lazy(() => import("@/pages/not-found"))),
  },
  {
    path: "/privacy-policy",
    name: "Privacy Policy",
    element: cw(lazy(() => import("@/pages/PrivacyPolicy"))),
  },
];

const allRoutes = {
  admin: [...dashboardRoutes, ...adminToolsRoutes],
  auth: authRoutes,
  other: otherRoutes,
};

export default allRoutes;
