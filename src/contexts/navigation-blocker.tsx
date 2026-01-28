import React, { createContext, useContext, useState, useCallback, useRef, useEffect, ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/daisyui";

interface NavigationBlockerContextType {
    /** Register a blocking condition */
    setBlocking: (isBlocking: boolean, message?: string) => void;
    /** Check if navigation is currently blocked */
    isBlocking: boolean;
    /** Attempt to navigate - will show dialog if blocked */
    tryNavigate: (to: string) => void;
    /** Custom message for the dialog */
    blockingMessage: string;
    /** Set callbacks for save and discard */
    setBlockingCallbacks: (callbacks: BlockingCallbacks | null) => void;
}

interface BlockingCallbacks {
    onSave?: () => Promise<void>;
    onDiscard?: () => void;
}

const NavigationBlockerContext = createContext<NavigationBlockerContextType | null>(null);

interface NavigationBlockerProviderProps {
    children: ReactNode;
}

export const NavigationBlockerProvider: React.FC<NavigationBlockerProviderProps> = ({ children }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isBlocking, setIsBlockingState] = useState(false);
    const [blockingMessage, setBlockingMessage] = useState("You have unsaved changes. What would you like to do?");
    const [showDialog, setShowDialog] = useState(false);
    const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const callbacksRef = useRef<BlockingCallbacks | null>(null);
    const isBlockingRef = useRef(false);
    const currentPathRef = useRef(location.pathname);

    // Keep refs in sync with state
    useEffect(() => {
        isBlockingRef.current = isBlocking;
    }, [isBlocking]);

    useEffect(() => {
        currentPathRef.current = location.pathname;
    }, [location.pathname]);

    // Handle browser back/forward buttons
    useEffect(() => {
        const handlePopState = () => {
            if (isBlockingRef.current) {
                const nextPath = window.location.pathname;
                // Use router navigation to keep URL + UI in sync
                navigate(currentPathRef.current, { replace: true });
                // Show the dialog with the previous path as pending
                setPendingNavigation(nextPath);
                setShowDialog(true);
            }
        };

        window.addEventListener("popstate", handlePopState);

        return () => {
            window.removeEventListener("popstate", handlePopState);
        };
    }, [navigate]);

    const setBlocking = useCallback((blocking: boolean, message?: string) => {
        setIsBlockingState(blocking);
        if (message) {
            setBlockingMessage(message);
        }
    }, []);

    const setBlockingCallbacks = useCallback((callbacks: BlockingCallbacks | null) => {
        callbacksRef.current = callbacks;
    }, []);

    const tryNavigate = useCallback((to: string) => {
        if (isBlocking) {
            setPendingNavigation(to);
            setShowDialog(true);
        } else {
            navigate(to);
        }
    }, [isBlocking, navigate]);

    const handleSaveAndExit = async () => {
        setSaving(true);
        try {
            if (callbacksRef.current?.onSave) {
                await callbacksRef.current.onSave();
            }
            setShowDialog(false);
            if (pendingNavigation) {
                navigate(pendingNavigation);
                setPendingNavigation(null);
            }
        } catch (error) {
            console.error("Error saving:", error);
        } finally {
            setSaving(false);
        }
    };

    const handleExitWithoutSaving = () => {
        if (callbacksRef.current?.onDiscard) {
            callbacksRef.current.onDiscard();
        }
        setShowDialog(false);
        if (pendingNavigation) {
            navigate(pendingNavigation);
            setPendingNavigation(null);
        }
    };

    const handleCancel = () => {
        setShowDialog(false);
        setPendingNavigation(null);
    };

    return (
        <NavigationBlockerContext.Provider
            value={{
                setBlocking,
                isBlocking,
                tryNavigate,
                blockingMessage,
                setBlockingCallbacks,
            }}
        >
            {children}

            {/* Navigation Confirmation Dialog */}
            {showDialog && (
                <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-[200]">
                    <div className="bg-base-100 rounded-xl shadow-lg p-8 max-w-xl w-full mx-4">
                        <h3 className="text-xl font-semibold mb-3 text-base-content">
                            {callbacksRef.current?.onSave ? "Unsaved Changes" : "Are you sure?"}
                        </h3>
                        <p className="text-base-content/60 mb-8">
                            {blockingMessage}
                        </p>
                        <div className="flex gap-3">
                            {callbacksRef.current?.onSave ? (
                                <>
                                    <Button
                                        onClick={handleSaveAndExit}
                                        className="bg-emerald-700 hover:bg-emerald-800 text-white border-none"
                                        disabled={saving}
                                    >
                                        {saving ? "Saving..." : "Save & Exit"}
                                    </Button>
                                    <Button
                                        onClick={handleExitWithoutSaving}
                                        className="bg-red-800 hover:bg-red-900 text-white border-none whitespace-nowrap px-6"
                                    >
                                        Exit without saving
                                    </Button>
                                    <Button
                                        onClick={handleCancel}
                                        variant="outline"
                                        className="border-slate-300 text-slate-600 hover:bg-slate-100 hover:border-slate-400"
                                    >
                                        Cancel
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <Button
                                        onClick={handleExitWithoutSaving}
                                        className="bg-red-700 hover:bg-red-800 text-white border-none px-6"
                                    >
                                        Yes, Leave
                                    </Button>
                                    <Button
                                        onClick={handleCancel}
                                        variant="outline"
                                        className="border-slate-300 text-slate-600 hover:bg-slate-100 hover:border-slate-400 px-6"
                                    >
                                        No, Stay
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </NavigationBlockerContext.Provider>
    );
};

export const useNavigationBlocker = () => {
    const context = useContext(NavigationBlockerContext);
    if (!context) {
        throw new Error("useNavigationBlocker must be used within a NavigationBlockerProvider");
    }
    return context;
};

/**
 * Hook for pages to register blocking conditions
 */
export const useBlockNavigation = (
    shouldBlock: boolean,
    callbacks?: BlockingCallbacks,
    message?: string
) => {
    const { setBlocking, setBlockingCallbacks } = useNavigationBlocker();

    React.useEffect(() => {
        setBlocking(shouldBlock, message);
        if (callbacks) {
            setBlockingCallbacks(callbacks);
        }

        return () => {
            setBlocking(false);
            setBlockingCallbacks(null);
        };
    }, [shouldBlock, setBlocking, setBlockingCallbacks, message]);

    // Also register the callbacks whenever they change
    React.useEffect(() => {
        if (callbacks) {
            setBlockingCallbacks(callbacks);
        }
    }, [callbacks, setBlockingCallbacks]);
};
