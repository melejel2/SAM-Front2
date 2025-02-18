import clsx from "clsx";
import { Children, HTMLAttributes, ReactElement, ReactNode, cloneElement, forwardRef } from "react";
import { twMerge } from "tailwind-merge";

import { ComponentColor, ComponentShape, ComponentSize, IComponentBaseProps } from "../types";
import { isSingleStringChild } from "../utils";

interface ChildElementProps {
  className?: string;
  style?: React.CSSProperties;
  children?: ReactNode;
}

export type AvatarProps = Omit<HTMLAttributes<HTMLDivElement>, "color"> &
  IComponentBaseProps & {
    src?: string;
    letters?: string;
    size?: ComponentSize | number;
    shape?: ComponentShape;
    color?: Exclude<ComponentColor, "ghost">;
    border?: boolean;
    borderColor?: Exclude<ComponentColor, "ghost">;
    online?: boolean;
    offline?: boolean;
    innerClassName?: string;
    children?: ReactNode;
    alt?: string;
  };

const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  (
    {
      size = "md",
      src,
      letters,
      shape,
      color,
      border,
      borderColor,
      online,
      offline,
      dataTheme,
      className,
      innerClassName,
      children,
      alt,
      ...props
    },
    ref
  ): ReactElement => {
    const customImgDimension = typeof size === "number" 
      ? { width: size, height: size }
      : {};

    const imgClasses = clsx(
      "avatar-img",
      {
        [`avatar-${size}`]: typeof size === "string",
      },
      innerClassName
    );

    const placeholderClasses = clsx(
      "placeholder",
      {
        [`bg-${color}`]: color,
        [`text-${color}-content`]: color,
      },
      innerClassName
    );

    const containerClasses = twMerge(
      clsx("avatar", {
        [`avatar-${size}`]: typeof size === "string",
        "online": online,
        "offline": offline,
        [`${shape}`]: shape,
        "ring": border,
        [`ring-${borderColor}`]: borderColor,
      }),
      className
    );

    const renderAvatarContents = () => {
      if (src) {
        return (
          <div className={imgClasses} style={customImgDimension}>
            <img src={src} alt={alt} />
          </div>
        );
      } else if (letters || isSingleStringChild(children)) {
        return (
          <div className={placeholderClasses} style={customImgDimension}>
            <span>{letters ? letters : children}</span>
          </div>
        );
      } else if (Children.count(children) === 1) {
        const firstChild = Children.only(children) as ReactElement<ChildElementProps>;
        return cloneElement<ChildElementProps>(
          firstChild,
          {
            className: twMerge(imgClasses, firstChild.props?.className),
            style: { 
              ...customImgDimension, 
              ...(firstChild.props?.style || {}) 
            },
          }
        );
      } else {
        return (
          <div className={imgClasses} style={customImgDimension}>
            {children}
          </div>
        );
      }
    };

    return (
      <div
        aria-label="Avatar photo"
        {...props}
        data-theme={dataTheme}
        className={containerClasses}
        ref={ref}
      >
        {renderAvatarContents()}
      </div>
    );
  }
);

Avatar.displayName = "Avatar";

export default Avatar;