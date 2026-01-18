import { useCallback, useMemo } from "react";
import { toast } from "sonner";

const useToast = () => {
    // Function to determine position based on screen width
    const getPosition = useCallback(
        () => (window.innerWidth < 768 ? "top-right" : "bottom-right"),
        [],
    );

    const show = useCallback((message: unknown) => {
        toast(String(message), { position: getPosition() });
    }, [getPosition]);

    const showSuccess = useCallback((message: unknown) => {
        toast.success(String(message), { position: getPosition() });
    }, [getPosition]);

    const showError = useCallback((message: unknown) => {
        toast.error(String(message), { position: getPosition() });
    }, [getPosition]);

    const showWarning = useCallback((message: unknown) => {
        toast.warning(String(message), { position: getPosition() });
    }, [getPosition]);

    const showInfo = useCallback((message: unknown) => {
        toast.info(String(message), { position: getPosition() });
    }, [getPosition]);

    const toaster = useMemo(
        () => ({
            show,
            success: showSuccess,
            error: showError,
            warning: showWarning,
            info: showInfo,
        }),
        [show, showSuccess, showError, showWarning, showInfo],
    );

    return {
        toaster,
    };
};

export default useToast;
