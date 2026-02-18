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

    handleRetry = () => {
        this.setState((prev) => ({
            hasError: false,
            error: null,
            retryKey: prev.retryKey + 1,
        }));
    };

    handleReload = () => {
        cacheBustingReload();
    };

    render() {
        if (this.state.hasError) {
            const chunk = this.state.error && isChunkError(this.state.error);

            return (
                <div className="min-h-screen flex items-center justify-center bg-base-100">
                    <div className="text-center max-w-md mx-auto p-8">
                        <div className="p-4 bg-error/10 rounded-full w-16 h-16 mx-auto mb-6 flex items-center justify-center">
                            <span className="iconify lucide--alert-triangle w-8 h-8 text-error" />
                        </div>

                        <h2 className="text-xl font-semibold text-base-content mb-2">
                            {chunk
                                ? "New version available"
                                : "Something went wrong"}
                        </h2>

                        <p className="text-base-content/70 mb-6">
                            {chunk
                                ? "A newer version of SAM has been deployed. Please refresh to load the latest version."
                                : "An unexpected error occurred. Please try again or refresh the page."}
                        </p>

                        <div className="flex gap-3 justify-center">
                            {!chunk && (
                                <button
                                    onClick={this.handleRetry}
                                    className="btn btn-outline btn-sm"
                                >
                                    Try Again
                                </button>
                            )}
                            <button
                                onClick={this.handleReload}
                                className="btn btn-primary btn-sm"
                            >
                                Refresh App
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
