import { memo } from "react";

interface LoadingEffectProps {
    width?: number | string;
    height?: number | string;
    className?: string;
    rounded?: "none" | "sm" | "md" | "lg" | "full";
}

export const LoadingEffect = memo(({
    width,
    height,
    className = "",
    rounded = "md"
}: LoadingEffectProps) => {
    const roundedClasses = {
        none: "",
        sm: "rounded-sm",
        md: "rounded-md",
        lg: "rounded-lg",
        full: "rounded-full"
    };

    return (
        <div
            className={`skeleton ${roundedClasses[rounded]} ${className}`}
            style={{ width, height }}
        />
    );
});

LoadingEffect.displayName = 'LoadingEffect';
