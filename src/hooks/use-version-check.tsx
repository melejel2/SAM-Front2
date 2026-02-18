import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { toast } from "sonner";

const VERSION_CHECK_INTERVAL = 3 * 60 * 1000; // 3 minutes
const TOAST_ID = "__version_mismatch__";

interface VersionData {
    version?: string;
    packageVersion?: string;
    releasedAt?: string;
    releaseNotes?: string;
}

function formatRelativeTime(isoDate: string): string {
    const diff = Date.now() - new Date(isoDate).getTime();
    const seconds = Math.floor(diff / 1000);
    if (seconds < 60) return "just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
}

async function fetchRemoteVersion(): Promise<VersionData | null> {
    try {
        const res = await fetch(`/version.json?_cb=${Date.now()}`, {
            cache: "no-store",
            headers: {
                "Cache-Control": "no-cache, no-store, must-revalidate",
                Pragma: "no-cache",
            },
        });
        if (!res.ok) return null;
        return (await res.json()) as VersionData;
    } catch {
        return null;
    }
}

function showUpdateToast(
    currentPkgVersion: string | undefined,
    remote: VersionData,
) {
    const relativeTime = remote.releasedAt
        ? formatRelativeTime(remote.releasedAt)
        : "";
    const oldVersion = currentPkgVersion || "unknown";
    const newVersion = remote.packageVersion || "latest";
    const releaseNotes = remote.releaseNotes || `What's new in v${newVersion}`;

    toast.custom(
        (id) => (
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                    padding: "14px 18px",
                    borderRadius: "12px",
                    background:
                        "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                    color: "#fff",
                    boxShadow: "0 4px 24px rgba(37, 99, 235, 0.3)",
                    minWidth: "340px",
                    maxWidth: "480px",
                    fontSize: "13px",
                }}
            >
                {/* Header row: icon + title + relative time */}
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                    }}
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
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
                    <span style={{ flex: 1, fontWeight: 600, fontSize: "14px" }}>
                        New Version Available
                    </span>
                    {relativeTime && (
                        <span
                            style={{
                                fontSize: "11px",
                                opacity: 0.7,
                                whiteSpace: "nowrap",
                            }}
                        >
                            {relativeTime}
                        </span>
                    )}
                </div>

                {/* Version badges row */}
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        justifyContent: "center",
                    }}
                >
                    <span
                        style={{
                            padding: "3px 10px",
                            borderRadius: "6px",
                            background: "rgba(255,255,255,0.15)",
                            fontFamily: "monospace",
                            fontSize: "12px",
                            letterSpacing: "0.3px",
                        }}
                    >
                        v{oldVersion}
                    </span>
                    <span style={{ opacity: 0.6, fontSize: "12px" }}>→</span>
                    <span
                        style={{
                            padding: "3px 10px",
                            borderRadius: "6px",
                            background: "rgba(255,255,255,0.25)",
                            fontFamily: "monospace",
                            fontSize: "12px",
                            fontWeight: 600,
                            letterSpacing: "0.3px",
                        }}
                    >
                        v{newVersion}
                    </span>
                </div>

                {/* Release notes */}
                <div>
                    <div
                        style={{
                            borderTop: "1px solid rgba(255,255,255,0.15)",
                            marginBottom: "8px",
                        }}
                    />
                    <p
                        style={{
                            margin: 0,
                            fontSize: "12px",
                            opacity: 0.85,
                            lineHeight: 1.4,
                        }}
                    >
                        {releaseNotes}
                    </p>
                </div>

                {/* Full-width Update Now button */}
                <button
                    onClick={() => {
                        toast.dismiss(id);
                        cacheBustingReload();
                    }}
                    style={{
                        width: "100%",
                        padding: "7px 0",
                        borderRadius: "8px",
                        background: "rgba(255,255,255,0.2)",
                        border: "1px solid rgba(255,255,255,0.3)",
                        color: "#fff",
                        fontSize: "13px",
                        fontWeight: 600,
                        cursor: "pointer",
                        backdropFilter: "blur(4px)",
                        transition: "background 0.15s",
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background =
                            "rgba(255,255,255,0.35)";
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background =
                            "rgba(255,255,255,0.2)";
                    }}
                >
                    Update Now
                </button>
            </div>
        ),
        {
            id: TOAST_ID,
            position: "top-center",
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
 * Shows a persistent Sonner toast when a mismatch is detected,
 * displaying version badges, relative timestamp, and release notes.
 */
export function useVersionCheck() {
    const location = useLocation();
    const localVersion = useRef(window.__APP_VERSION__);
    const currentPkgVersion = useRef(window.__APP_PKG_VERSION_EMBEDDED__);
    const mismatchShown = useRef(false);

    const check = async () => {
        // Skip if no local version was injected (dev mode)
        if (!localVersion.current) return;
        // Skip if we already showed the toast
        if (mismatchShown.current) return;

        const remote = await fetchRemoteVersion();
        if (remote?.version && remote.version !== localVersion.current) {
            mismatchShown.current = true;
            showUpdateToast(currentPkgVersion.current, remote);
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
