import { memo } from "react";

interface CloseBtnProps {
    handleClose: () => void;
    className?: string;
    size?: "xs" | "sm" | "md" | "lg";
    position?: "top-right" | "top-left" | "custom";
}

const CloseBtn = memo(({
    handleClose,
    className = "",
    size = "sm",
    position = "top-right"
}: CloseBtnProps) => {
    const sizeClasses = {
        xs: "btn-xs",
        sm: "btn-sm",
        md: "btn-md",
        lg: "btn-lg"
    };

    const positionClasses = {
        "top-right": "absolute top-2 right-2",
        "top-left": "absolute top-2 left-2",
        "custom": ""
    };

    return (
        <button
            type="button"
            className={`btn ${sizeClasses[size]} btn-circle btn-ghost ${positionClasses[position]} ${className}`}
            onClick={handleClose}
            aria-label="Close">
            ✕
        </button>
    );
});

CloseBtn.displayName = 'CloseBtn';

export default CloseBtn;
