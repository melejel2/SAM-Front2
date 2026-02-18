import { Component, ReactNode } from "react";
import { cacheBustingReload } from "@/hooks/use-version-check";

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    retryKey: number;
}

const COOLDOWN_MS = 10_000; // 10 seconds between auto-retries

function isChunkError(error: Error): boolean {
    const msg = error.message || "";
    return (
        msg.includes("Failed to fetch dynamically imported module") ||
        msg.includes("Importing a module script failed") ||
        msg.includes("Loading chunk") ||
        msg.includes("Loading CSS chunk") ||
        msg.includes("ChunkLoadError")
    );
}

/**
 * Global error boundary that catches chunk loading failures
 * (stale deploy) and offers a cache-busting reload.
 * Uses a cooldown-based retry key instead of a permanent lock.
 */
export class AppErrorBoundary extends Component<Props, State> {
    private lastRetryTime = 0;

    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null, retryKey: 0 };
    }

    static getDerivedStateFromError(error: Error): Partial<State> {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error) {
        console.error("[AppErrorBoundary]", error);

        // Auto-reload on chunk errors if cooldown has passed
        if (isChunkError(error)) {
            const now = Date.now();
            if (now - this.lastRetryTime > COOLDOWN_MS) {
                this.lastRetryTime = now;
                cacheBustingReload();
            }
        }
    }

    handleRefresh = () => {
        cacheBustingReload();
    };

    render() {
        if (this.state.hasError) {
            const chunk = this.state.error && isChunkError(this.state.error);

            if (chunk) {
                return (
                    <div className="flex items-center justify-center min-h-screen bg-base-200/50 p-4">
                        <div className="max-w-sm w-full rounded-2xl bg-base-100 shadow-lg border border-base-200 overflow-hidden">
                            <div className="bg-primary/5 px-6 pt-8 pb-6 flex flex-col items-center">
                                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182" />
                                    </svg>
                                </div>
                                <h2 className="text-lg font-semibold text-base-content">
                                    Update Available
                                </h2>
                                <p className="text-sm text-base-content/60 mt-1 text-center">
                                    A new version has been deployed. Please refresh to continue.
                                </p>
                            </div>
                            <div className="px-6 pb-6 pt-4 flex flex-col items-center gap-3">
                                <button onClick={this.handleRefresh} className="btn btn-primary btn-sm w-full">
                                    Refresh Now
                                </button>
                                <p className="text-[11px] text-base-content/35 text-center">
                                    If this keeps happening, close all tabs and reopen.
                                </p>
                            </div>
                        </div>
                    </div>
                );
            }

            return (
                <div className="flex items-center justify-center min-h-screen bg-base-200/50 p-4">
                    <div className="max-w-sm w-full rounded-2xl bg-base-100 shadow-lg border border-base-200 overflow-hidden">
                        <div className="bg-error/5 px-6 pt-8 pb-6 flex flex-col items-center">
                            <div className="w-14 h-14 rounded-full bg-error/10 flex items-center justify-center mb-4">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                                </svg>
                            </div>
                            <h2 className="text-lg font-semibold text-base-content">
                                Something Went Wrong
                            </h2>
                            <p className="text-sm text-base-content/60 mt-1 text-center">
                                An unexpected error occurred. Please try refreshing the page.
                            </p>
                        </div>
                        <div className="px-6 pb-6 pt-4 flex flex-col items-center gap-3">
                            <button onClick={this.handleRefresh} className="btn btn-primary btn-sm w-full">
                                Refresh Page
                            </button>
                            <p className="text-[11px] text-base-content/35 text-center">
                                If the problem persists, contact support.
                            </p>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
