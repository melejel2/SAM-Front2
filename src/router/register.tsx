import { JSX, LazyExoticComponent, lazy } from "react";
import { RouteProps } from "react-router";

// import { docsRoutes } from "@/pages/docs/routes";

export type IRoutesProps = {
    path: RouteProps["path"];
    element: RouteProps["element"];
};

// Component Wrapper
const cw = (Component: LazyExoticComponent<() => JSX.Element>) => {
    return <Component />;
};

const dashboardRoutes: IRoutesProps[] = [
    {
        path: "/dashboard",
        element: cw(lazy(() => import("@/pages/admin/dashboards/dashboard"))),
    },
];

const adminToolsRoutes: IRoutesProps[] = [
    {
        path: "/admin-tools/users",
        element: cw(lazy(() => import("@/pages/admin/adminTools/users"))),
    },
];

const authRoutes: IRoutesProps[] = [
    {
        path: "/auth/login",
        element: cw(lazy(() => import("@/pages/auth/login"))),
    },
    {
        path: "/auth/register",
        element: cw(lazy(() => import("@/pages/auth/register"))),
    },
    {
        path: "/auth/forgot-password",
        element: cw(lazy(() => import("@/pages/auth/forgot-password"))),
    },
    {
        path: "/auth/reset-password",
        element: cw(lazy(() => import("@/pages/auth/reset-password"))),
    },
];

const otherRoutes: IRoutesProps[] = [
    {
        path: "/*",
        element: cw(lazy(() => import("@/pages/not-found"))),
    },
    {
        path: "/privacy-policy",
        element: cw(lazy(() => import("@/pages/PrivacyPolicy"))),
    },
];

export const registerRoutes = {
    admin: [...dashboardRoutes, ...adminToolsRoutes],
    auth: authRoutes,
    other: otherRoutes,
};
