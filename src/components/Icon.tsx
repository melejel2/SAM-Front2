import { memo } from "react";

interface IconProps {
    icon: string;
    fontSize?: number;
    className?: string;
}

/**
 * Icon component using Iconify with Lucide icons
 *
 * DEPRECATED: This string-based approach can cause icon rendering issues (squares).
 *
 * RECOMMENDED: Import icon objects directly and use @iconify/react Icon component:
 *
 * ```tsx
 * import { Icon } from "@iconify/react";
 * import searchIcon from "@iconify/icons-lucide/search";
 *
 * <Icon icon={searchIcon} className="w-4 h-4" />
 * ```
 *
 * This component is kept for backward compatibility with existing code.
 */
const IconLegacy = memo(({ icon, fontSize = 4, className = "" }: IconProps) => {
    return <span className={`iconify lucide--${icon} size-${fontSize} ${className}`} />;
});

IconLegacy.displayName = 'Icon';

export default IconLegacy;
