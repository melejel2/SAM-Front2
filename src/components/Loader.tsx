import { memo, ReactNode } from "react";

interface LoaderProps {
    height?: string;
    width?: string;
    size?: "xs" | "sm" | "md" | "lg" | "xl";
    /** @deprecated Use title instead */
    text?: string;
    /** Main loading title (e.g., "Processing Data") */
    title?: string;
    /** Highlighted subtitle in primary color (e.g., "Loading: 12.Aluminium Works") */
    subtitle?: string;
    /** Description text below subtitle (e.g., "Loading 12.Aluminium Works data...") */
    description?: string;
    /** Lucide icon name (e.g., "table-2", "receipt", "file-text") - will be prefixed with "lucide--" */
    icon?: string;
    /** Custom icon element instead of string */
    iconElement?: ReactNode;
    /** Minimum height for container (useful for inline loaders) */
    minHeight?: string;
    /** Show progress bar (0-100 for determinate, undefined for indeterminate) */
    progress?: number;
    /** Show indeterminate progress bar */
    showProgress?: boolean;
    /** Overlay mode - positions loader as absolute overlay inside parent container */
    overlay?: boolean;
}

// Size configurations for the spinner
const sizeConfig = {
    xs: {
        container: "w-12 h-12",
        spinner: "w-12 h-12",
        iconBg: "w-10 h-10",
        icon: "size-4",
        border: "border-2"
    },
    sm: {
        container: "w-14 h-14",
        spinner: "w-14 h-14",
        iconBg: "w-11 h-11",
        icon: "size-5",
        border: "border-2"
    },
    md: {
        container: "w-16 h-16",
        spinner: "w-16 h-16",
        iconBg: "w-12 h-12",
        icon: "size-6",
        border: "border-3"
    },
    lg: {
        container: "w-20 h-20",
        spinner: "w-20 h-20",
        iconBg: "w-14 h-14",
        icon: "size-7",
        border: "border-3"
    },
    xl: {
        container: "w-24 h-24",
        spinner: "w-24 h-24",
        iconBg: "w-16 h-16",
        icon: "size-8",
        border: "border-4"
    },
};

export const Loader = memo(({
    height = "80vh",
    width = "full",
    size = "lg",
    text,
    title = "Processing Data",
    subtitle,
    description,
    icon = "loader-2",
    iconElement,
    minHeight = "400px",
    progress,
    showProgress = true,
    overlay = false
}: LoaderProps = {}) => {
    const config = sizeConfig[size];
    const displayTitle = title || text;
    const hasIcon = icon || iconElement;
    const isIndeterminate = progress === undefined;

    // Convert icon name to iconify class format (e.g., "receipt" -> "lucide--receipt")
    const iconClass = icon ? `iconify lucide--${icon.replace('lucide:', '').replace('lucide--', '')}` : '';

    const loaderContent = (
        <div className="text-center space-y-4">
            {/* Spinner with centered icon */}
            <div className={`relative ${config.container} mx-auto`}>
                {/* Spinning border ring */}
                <div
                    className={`absolute inset-0 ${config.spinner} ${config.border} border-primary/20 border-t-primary rounded-full animate-spin`}
                />
                {/* Static icon background circle */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className={`${config.iconBg} rounded-full bg-base-100 shadow-sm flex items-center justify-center`}>
                        {hasIcon && (
                            iconElement || (
                                <span className={`${iconClass} ${config.icon} text-base-content/70`} />
                            )
                        )}
                    </div>
                </div>
            </div>

            {/* Text content */}
            <div className="space-y-1">
                {displayTitle && (
                    <h3 className="text-base font-semibold text-base-content">{displayTitle}</h3>
                )}
                {subtitle && (
                    <p className="text-sm font-medium text-primary">{subtitle}</p>
                )}
                {description && (
                    <p className="text-sm text-base-content/60">{description}</p>
                )}
            </div>

            {/* Progress bar */}
            {showProgress && (
                <div className="w-48 mx-auto">
                    {isIndeterminate ? (
                        <div className="h-1.5 bg-base-200 rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full animate-progress-indeterminate" />
                        </div>
                    ) : (
                        <div className="h-1.5 bg-base-200 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-primary rounded-full transition-all duration-300"
                                style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                            />
                        </div>
                    )}
                </div>
            )}
        </div>
    );

    // Overlay mode - for loading inside containers
    if (overlay) {
        return (
            <div className="absolute inset-0 bg-base-200/80 backdrop-blur-sm flex items-center justify-center z-10">
                {loaderContent}
            </div>
        );
    }

    // Default mode - standalone loader
    return (
        <div
            className="flex items-center justify-center h-full"
            style={{
                height: height,
                width: width === 'full' ? '100%' : width,
                minHeight: minHeight
            }}
        >
            {loaderContent}
        </div>
    );
});

Loader.displayName = 'Loader';

/**
 * LoaderOverlay - A wrapper component that shows content with a loader overlay
 * Use this when you want the container to render but show a loading state on top
 */
export const LoaderOverlay = memo(({
    loading,
    children,
    icon,
    subtitle,
    description,
    size = "lg",
    showProgress = true
}: {
    loading: boolean;
    children: ReactNode;
    icon?: string;
    subtitle?: string;
    description?: string;
    size?: "xs" | "sm" | "md" | "lg" | "xl";
    showProgress?: boolean;
}) => {
    return (
        <div className="relative h-full w-full">
            {children}
            {loading && (
                <Loader
                    overlay
                    icon={icon}
                    subtitle={subtitle}
                    description={description}
                    size={size}
                    showProgress={showProgress}
                />
            )}
        </div>
    );
});

LoaderOverlay.displayName = 'LoaderOverlay';
