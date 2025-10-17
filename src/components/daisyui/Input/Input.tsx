import clsx from "clsx";
import { InputHTMLAttributes, ReactElement, forwardRef, memo } from "react";
import { twMerge } from "tailwind-merge";

import { ComponentColor, ComponentSize, IComponentBaseProps } from "../types";

export type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "size" | "color"> &
    IComponentBaseProps & {
        bordered?: boolean;
        borderOffset?: boolean;
        size?: ComponentSize;
        color?: ComponentColor;
    };

const InputInner = forwardRef<HTMLInputElement, InputProps>(
    (
        { value, placeholder, bordered = true, borderOffset, size, color, dataTheme, className, type, ...props },
        ref,
    ): ReactElement => {
        const classes = twMerge(
            "input",
            className,
            clsx({
                "input-lg": size === "lg",
                "input-md": size === "md",
                "input-sm": size === "sm",
                "input-xs": size === "xs",
                "input-primary": color === "primary",
                "input-secondary": color === "secondary",
                "input-accent": color === "accent",
                "input-ghost": color === "ghost",
                "input-info": color === "info",
                "input-success": color === "success",
                "input-warning": color === "warning",
                "input-error": color === "error",
                "input-bordered": bordered,
                "focus:outline-offset-0": !borderOffset,
            }),
        );

        return (
            <input
                {...props}
                ref={ref}
                type={type}
                value={value}
                placeholder={placeholder}
                data-theme={dataTheme}
                className={classes}
            />
        );
    },
);

InputInner.displayName = "Input";

// Wrap with memo for performance optimization
const Input = memo(InputInner) as typeof InputInner;

export default Input;
