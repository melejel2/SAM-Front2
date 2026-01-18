import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "sonner";
import { MsalProvider } from "@azure/msal-react";
import { PublicClientApplication } from "@azure/msal-browser";

import { AuthConfigProvider } from "@/contexts/auth";
import { ArchiveProvider } from "@/contexts/archive";
import { ConfigProvider } from "@/contexts/config";
import { NavigationBlockerProvider } from "@/contexts/navigation-blocker";
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
                        <ArchiveProvider>
                            <NavigationBlockerProvider>
                                <Router />
                                <Toaster richColors />
                            </NavigationBlockerProvider>
                        </ArchiveProvider>
                    </AuthConfigProvider>
                </ConfigProvider>
            </BrowserRouter>
        </MsalProvider>
    </StrictMode>,
);
