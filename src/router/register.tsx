import { JSX, LazyExoticComponent, lazy } from "react";
import { RouteProps } from "react-router";

// import { docsRoutes } from "@/pages/docs/routes";

export type IRoutesProps = {
    path: RouteProps["path"];
    element: RouteProps["element"];
};

// Component Wrapper
const cw = (Component: LazyExoticComponent<React.ComponentType<any>>) => {
    return <Component />;
};

const dashboardRoutes: IRoutesProps[] = [
    {
        path: "/dashboard",
        element: cw(lazy(() => import("@/pages/admin/dashboards/dashboard"))),
    },
    {
        path: "/dashboard/budget-BOQs",
        element: cw(lazy(() => import("@/pages/admin/dashboards/budget-boqs"))),
    },
    {
        path: "/dashboard/budget-BOQs/edit/:projectIdentifier",
        element: cw(lazy(() => import("@/pages/admin/dashboards/budget-boqs/edit"))),
    },
    {
        path: "/dashboard/subcontractors-BOQs",
        element: cw(lazy(() => import("@/pages/admin/dashboards/subcontractors-BOQs"))),
    },
    {
        path: "/dashboard/subcontractors-boqs/new",
        element: cw(lazy(() => import("@/pages/admin/dashboards/subcontractors-BOQs/new"))),
    },
    {
        path: "/dashboard/subcontractors-boqs/edit/:contractIdentifier",
        element: cw(lazy(() => import("@/pages/admin/dashboards/subcontractors-BOQs/edit"))),
    },
    {
        path: "/dashboard/subcontractors-boqs/details/:contractIdentifier",
        element: cw(lazy(() => import("@/pages/admin/dashboards/subcontractors-BOQs/details"))),
    },
    {
        path: "/dashboard/subcontractors-boqs/details/:contractIdentifier/create-vo",
        element: cw(lazy(() => import("@/pages/admin/dashboards/subcontractors-BOQs/details/create-vo"))),
    },
    {
        path: "/dashboard/contracts-database",
        element: cw(lazy(() => import("@/pages/admin/dashboards/contracts-database"))),
    },
    {
        path: "/dashboard/contracts-database/details/:contractIdentifier",
        element: cw(lazy(() => import("@/pages/admin/dashboards/contracts-database/details"))),
    },
    {
        path: "/dashboard/contracts-database/details/:contractIdentifier/create-vo",
        element: cw(lazy(() => import("@/pages/admin/dashboards/subcontractors-BOQs/details/create-vo"))),
    },
    {
        path: "/dashboard/deductions-database",
        element: cw(lazy(() => import("@/pages/admin/dashboards/deductions-database"))),
    },
    {
        path: "/dashboard/IPCs-database",
        element: cw(lazy(() => import("@/pages/admin/dashboards/IPCs-database"))),
    },
    {
        path: "/dashboard/IPCs-database/edit/:id",
        element: cw(lazy(() => import("@/pages/admin/dashboards/IPCs-database/edit"))),
    },
    {
        path: "/dashboard/reports",
        element: cw(lazy(() => import("@/pages/admin/dashboards/reports"))),
    },
];

const variationOrdersRoutes: IRoutesProps[] = [
    {
        path: "/admin/variation-orders",
        element: cw(lazy(() => import("@/pages/admin/variation-orders"))),
    },
    {
        path: "/admin/variation-orders/create",
        element: cw(lazy(() => import("@/pages/admin/variation-orders/wizard"))),
    },
];

const adminToolsRoutes: IRoutesProps[] = [
    {
        path: "/admin-tools",
        element: cw(lazy(() => import("@/pages/admin/adminTools"))),
    },
    {
        path: "/admin-tools/currencies",
        element: cw(lazy(() => import("@/pages/admin/adminTools/currencies"))),
    },
    {
        path: "/admin-tools/units",
        element: cw(lazy(() => import("@/pages/admin/adminTools/units"))),
    },
    {
        path: "/admin-tools/users",
        element: cw(lazy(() => import("@/pages/admin/adminTools/users"))),
    },
    {
        path: "/admin-tools/trades",
        element: cw(lazy(() => import("@/pages/admin/adminTools/trades"))),
    },
    {
        path: "/admin-tools/cost-codes",
        element: cw(lazy(() => import("@/pages/admin/adminTools/cost-codes"))),
    },
    {
        path: "/admin-tools/templates",
        element: cw(lazy(() => import("@/pages/admin/adminTools/templates"))),
    },
    // {
    //     path: "/admin-tools/sheets",
    //     element: cw(lazy(() => import("@/pages/admin/adminTools/sheets"))),
    // },
    {
        path: "/admin-tools/projects",
        element: cw(lazy(() => import("@/pages/admin/adminTools/projects"))),
    },
    // {
    //     path: "/admin-tools/buildings",
    //     element: cw(lazy(() => import("@/pages/admin/adminTools/buildings"))),
    // },
    {
        path: "/admin-tools/subcontractors",
        element: cw(lazy(() => import("@/pages/admin/adminTools/subcontractors"))),
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
    admin: [...dashboardRoutes, ...variationOrdersRoutes, ...adminToolsRoutes],
    auth: authRoutes,
    other: otherRoutes,
};
