import { Suspense, useEffect } from "react";
import { Navigate, Route, RouteProps, Routes } from "react-router";

import { useAuth } from "@/contexts/auth";
import AdminLayout from "@/pages/admin/(layout)";
import AuthLayout from "@/pages/auth/layout";

import { registerRoutes } from "./register";

export const Router = (props: RouteProps) => {
    const { isLoggedIn } = useAuth();

    return (
        <Routes>
            <Route
                path="/"
                element={
                    isLoggedIn() ? <Navigate to={"/dashboard"} replace /> : <Navigate to={"/auth/login"} replace />
                }
            />
            
            {/* Admin routes - back to flat structure with stable keys */}
            {registerRoutes.admin.map((route, index) => (
                <Route
                    key={route.path}
                    path={route.path}
                    element={
                        isLoggedIn() ? (
                            <AdminLayout {...props}>
                                <Suspense>{route.element}</Suspense>
                            </AdminLayout>
                        ) : (
                            <Navigate to={"/auth/login"} replace />
                        )
                    }
                />
            ))}
            
            {/* Auth routes */}
            {registerRoutes.auth.map((route, index) => (
                <Route
                    key={"auth-" + index}
                    path={route.path}
                    element={
                        <AuthLayout {...props}>
                            <Suspense key={route.path}>{route.element}</Suspense>
                        </AuthLayout>
                    }
                />
            ))}

            {/* Other routes */}
            {registerRoutes.other.map((route, index) => (
                <Route key={"other-" + index} path={route.path} element={<Suspense key={route.path}>{route.element}</Suspense>} />
            ))}
        </Routes>
    );
};
