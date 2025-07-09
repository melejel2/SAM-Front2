import { StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "sonner";

import { AuthConfigProvider } from "@/contexts/auth";
import { ConfigProvider } from "@/contexts/config";
import { Router } from "@/router";

import "./styles/app.css";

const root = createRoot(document.getElementById("root")!);

root.render(
    <StrictMode>
        <BrowserRouter>
            <ConfigProvider>
                <AuthConfigProvider>
                    <Router />
                    <Toaster richColors />
                </AuthConfigProvider>
            </ConfigProvider>
        </BrowserRouter>
    </StrictMode>,
);
