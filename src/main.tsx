import "antd/dist/reset.css";
import { StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "sonner";
import { MsalProvider } from "@azure/msal-react";
import { PublicClientApplication } from "@azure/msal-browser";

import { AuthConfigProvider } from "@/contexts/auth";
import { ConfigProvider } from "@/contexts/config";
import { Router } from "@/router";
import { msalConfig } from "@/config/msal";

import "./styles/app.css";

const msalInstance = new PublicClientApplication(msalConfig);

const root = createRoot(document.getElementById("root")!);

root.render(
    <StrictMode>
        <MsalProvider instance={msalInstance}>
            <BrowserRouter>
                <ConfigProvider>
                    <AuthConfigProvider>
                        <Router />
                        <Toaster richColors />
                    </AuthConfigProvider>
                </ConfigProvider>
            </BrowserRouter>
        </MsalProvider>
    </StrictMode>,
);
