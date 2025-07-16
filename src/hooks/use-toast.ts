import { toast } from "sonner";

const useToast = () => {
    // Function to determine position based on screen width
    const getPosition = () => (window.innerWidth < 768 ? "top-right" : "bottom-right");

    const show = (message: unknown) => {
        toast(String(message), { position: getPosition() });
    };

    const showSuccess = (message: unknown) => {
        toast.success(String(message), { position: getPosition() });
    };

    const showError = (message: unknown) => {
        toast.error(String(message), { position: getPosition() });
    };

    const showWarning = (message: unknown) => {
        toast.warning(String(message), { position: getPosition() });
    };

    const showInfo = (message: unknown) => {
        toast.info(String(message), { position: getPosition() });
    };

    const toaster = {
        show,
        success: showSuccess,
        error: showError,
        warning: showWarning,
        info: showInfo,
    };

    return {
        toaster,
    };
};

export default useToast;
