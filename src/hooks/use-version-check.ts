import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { toast } from "sonner";

const VERSION_CHECK_INTERVAL = 3 * 60 * 1000; // 3 minutes
const TOAST_ID = "__version_mismatch__";

async function fetchRemoteVersion(): Promise<string | null> {
    try {
        const res = await fetch(`/version.json?_cb=${Date.now()}`, {
            cache: "no-store",
            headers: {
                "Cache-Control": "no-cache, no-store, must-revalidate",
                Pragma: "no-cache",
            },
        });
        if (!res.ok) return null;
        const data = await res.json();
        return data.buildId ?? null;
    } catch {
        return null;
    }
}

function showUpdateToast() {
    toast.info("A new version of SAM is available.", {
        id: TOAST_ID,
        duration: Infinity,
        action: {
            label: "Refresh",
            onClick: () => cacheBustingReload(),
        },
    });
}

/**
 * Best-effort cache-busting reload:
 * 1. Try to clear Cache API entries
 * 2. Navigate with a cache-busting query param
 */
export async function cacheBustingReload() {
    // Best-effort clear Cache API entries
    try {
        if ("caches" in window) {
            const keys = await caches.keys();
            await Promise.allSettled(keys.map((k) => caches.delete(k)));
        }
    } catch {
        // ignore
    }

    // Brief wait for cache cleanup, bounded
    await new Promise((r) => setTimeout(r, 200));

    // Navigate with cache-busting param
    const url = new URL(window.location.href);
    url.searchParams.set("_v", String(Date.now()));
    window.location.replace(url.toString());
}

/**
 * Hook that checks for new app versions:
 * - On app startup (mount)
 * - On every route change
 * - Every 3 minutes via interval
 * - On tab focus (visibilitychange)
 *
 * Shows a persistent Sonner toast when a mismatch is detected.
 */
export function useVersionCheck() {
    const location = useLocation();
    const localVersion = useRef(window.__APP_VERSION__);
    const mismatchShown = useRef(false);

    const check = async () => {
        // Skip if no local version was injected (dev mode)
        if (!localVersion.current) return;
        // Skip if we already showed the toast
        if (mismatchShown.current) return;

        const remote = await fetchRemoteVersion();
        if (remote && remote !== localVersion.current) {
            mismatchShown.current = true;
            showUpdateToast();
        }
    };

    // Check on mount
    useEffect(() => {
        check();
    }, []);

    // Check on route change
    useEffect(() => {
        check();
    }, [location.pathname]);

    // Interval check every 3 minutes
    useEffect(() => {
        const id = setInterval(check, VERSION_CHECK_INTERVAL);
        return () => clearInterval(id);
    }, []);

    // Check on tab focus
    useEffect(() => {
        const onVisibility = () => {
            if (document.visibilityState === "visible") {
                check();
            }
        };
        document.addEventListener("visibilitychange", onVisibility);
        return () =>
            document.removeEventListener("visibilitychange", onVisibility);
    }, []);
}
