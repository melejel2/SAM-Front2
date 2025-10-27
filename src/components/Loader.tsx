import { memo } from "react";

interface LoaderProps {
    height?: string;
    width?: string;
    size?: "xs" | "sm" | "md" | "lg" | "xl";
    text?: string;
}

export const Loader = memo(({
    height = "80vh",
    width = "full",
    size = "lg",
    text
}: LoaderProps = {}) => {
    return (
        <div
            className="flex items-center justify-center"
            style={{
                height: height,
                width: width === 'full' ? '100%' : width
            }}
        >
            <div className="flex flex-col items-center gap-4">
                {/* Standard CSS spinner using Tailwind classes - conditional rendering for static classes */}
                {size === 'xs' && (
                    <div className="w-6 h-6 animate-spin text-blue-500">
                        <svg className="w-full h-full" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                    </div>
                )}
                {size === 'sm' && (
                    <div className="w-8 h-8 animate-spin text-blue-500">
                        <svg className="w-full h-full" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                    </div>
                )}
                {size === 'md' && (
                    <div className="w-12 h-12 animate-spin text-blue-500">
                        <svg className="w-full h-full" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                    </div>
                )}
                {size === 'lg' && (
                    <div className="w-16 h-16 animate-spin text-blue-500">
                        <svg className="w-full h-full" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                    </div>
                )}
                {size === 'xl' && (
                    <div className="w-24 h-24 animate-spin text-blue-500">
                        <svg className="w-full h-full" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                    </div>
                )}
                {text && (
                    <p className="text-base-content/70 text-base font-medium">
                        {text}
                    </p>
                )}
            </div>
        </div>
    );
});

Loader.displayName = 'Loader';
