import { memo } from "react";

interface LoaderProps {
    height?: string;
    width?: string;
    size?: "xs" | "sm" | "md" | "lg" | "xl";
    variant?: "spinner" | "dots" | "ring" | "ball" | "bars" | "infinity";
    color?: "primary" | "secondary" | "accent" | "info" | "success" | "warning" | "error";
    text?: string;
}

export const Loader = memo(({
    height = "80vh",
    width = "full",
    size = "lg",
    variant = "ring",
    color = "info",
    text
}: LoaderProps = {}) => {
    const sizeClasses = {
        xs: "loading-xs",
        sm: "loading-sm",
        md: "loading-md",
        lg: "loading-lg",
        xl: "w-48 h-48"
    };

    const colorClasses = {
        primary: "text-primary",
        secondary: "text-secondary",
        accent: "text-accent",
        info: "text-info",
        success: "text-success",
        warning: "text-warning",
        error: "text-error"
    };

    return (
        <div className={`flex h-[${height}] w-${width} items-center justify-center`}>
            <div className="text-center">
                <span className={`loading loading-${variant} ${sizeClasses[size]} ${colorClasses[color]}`}></span>
                {text && <p className="text-base-content/70 mt-4 text-sm">{text}</p>}
            </div>
        </div>
    );
});

Loader.displayName = 'Loader';
