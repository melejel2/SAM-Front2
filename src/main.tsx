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
import { AppErrorBoundary } from "@/components/AppErrorBoundary";
import { cacheBustingReload } from "@/hooks/use-version-check";
import { VersionChecker } from "@/components/VersionChecker";

import "./styles/app.css";

// ── Boot flow safety: strip ?_v cache-busting param after load ──
const bootUrl = new URL(window.location.href);
if (bootUrl.searchParams.has("_v")) {
    bootUrl.searchParams.delete("_v");
    window.history.replaceState(null, "", bootUrl.pathname + bootUrl.search + bootUrl.hash);
}

// ── Clean legacy session keys ──
try {
    sessionStorage.removeItem("__chunk_error_refresh__");
} catch {
    // ignore
}

// ── Global chunk / dynamic-import error handlers ──
function isChunkError(msg: string): boolean {
    return (
        msg.includes("Failed to fetch dynamically imported module") ||
        msg.includes("Importing a module script failed") ||
        msg.includes("Loading chunk") ||
        msg.includes("Loading CSS chunk") ||
        msg.includes("ChunkLoadError")
    );
}

window.addEventListener("error", (event) => {
    if (event.error && isChunkError(String(event.error.message ?? ""))) {
        event.preventDefault();
        cacheBustingReload();
    }
});

window.addEventListener("unhandledrejection", (event) => {
    const msg = String(event.reason?.message ?? event.reason ?? "");
    if (isChunkError(msg)) {
        event.preventDefault();
        cacheBustingReload();
    }
});

// ── Render ──
const msalInstance = new PublicClientApplication(msalConfig);

const root = createRoot(document.getElementById("root")!);

root.render(
    <StrictMode>
        <AppErrorBoundary>
            <MsalProvider instance={msalInstance}>
                <BrowserRouter>
                    <ConfigProvider>
                        <AuthConfigProvider>
                            <ArchiveProvider>
                                <NavigationBlockerProvider>
                                    <Router />
                                    <VersionChecker />
                                    <Toaster richColors />
                                </NavigationBlockerProvider>
                            </ArchiveProvider>
                        </AuthConfigProvider>
                    </ConfigProvider>
                </BrowserRouter>
            </MsalProvider>
        </AppErrorBoundary>
    </StrictMode>,
);
