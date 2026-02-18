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
    toast.custom(
        (id) => (
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 16px',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                    color: '#fff',
                    boxShadow: '0 4px 24px rgba(37, 99, 235, 0.3)',
                    minWidth: '320px',
                    maxWidth: '480px',
                    fontSize: '13px',
                }}
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ flexShrink: 0, opacity: 0.9 }}
                >
                    <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
                    <path d="M21 3v5h-5" />
                </svg>
                <span style={{ flex: 1 }}>
                    A new version is available
                </span>
                <button
                    onClick={() => {
                        toast.dismiss(id);
                        cacheBustingReload();
                    }}
                    style={{
                        padding: '5px 14px',
                        borderRadius: '6px',
                        background: 'rgba(255,255,255,0.2)',
                        border: '1px solid rgba(255,255,255,0.3)',
                        color: '#fff',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        backdropFilter: 'blur(4px)',
                        transition: 'background 0.15s',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.35)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.2)'; }}
                >
                    Update Now
                </button>
            </div>
        ),
        {
            id: TOAST_ID,
            position: 'top-center',
            duration: Infinity,
        },
    );
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
