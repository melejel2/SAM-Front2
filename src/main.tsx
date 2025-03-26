import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import { Toaster } from "sonner";

import { AuthConfigProvider } from "@/contexts/auth";
// ensure this is from react-router-dom
import { ConfigProvider } from "@/contexts/config";
// update path as necessary
import { Router } from "@/router";

import "./styles/app.css";

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <BrowserRouter>
            <AuthConfigProvider>
                <ConfigProvider>
                    <Router />
                    <Toaster richColors />
                </ConfigProvider>
            </AuthConfigProvider>
        </BrowserRouter>
    </StrictMode>,
);
