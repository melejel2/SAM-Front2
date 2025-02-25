import { Children, Fragment, ReactElement, ReactNode, cloneElement, isValidElement } from "react";
import { twMerge } from "tailwind-merge";

export const toTitleCase = (str: string) => {
    return str
        .toLowerCase()
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
};

// Type predicate for React Fragments
export const isReactFragment = (node: ReactNode | typeof Fragment): node is ReactElement<any> => {
    if (!node) return false;
    if ((node as ReactElement<any>).type) {
        return (node as ReactElement<any>).type === Fragment;
    }
    return node === Fragment;
};

type WrapperProps = {
    className?: string;
    children?: ReactNode;
    [key: string]: any;
};

export const wrapWithElementIfInvalid = <P extends WrapperProps>({
    node,
    wrapper,
    props = {},
}: {
    node: ReactNode;
    wrapper: ReactElement<P>;
    props?: Partial<P>;
}) => {
    if (!node) {
        return cloneElement(wrapper, props);
    } else if (!isValidElement(node)) {
        return cloneElement(wrapper, props, node);
    } else if (isReactFragment(node)) {
        const nodeElement = node as ReactElement<any>;
        return cloneElement(
            wrapper,
            {
                ...props,
                className: twMerge(nodeElement.props?.className, props?.className),
            },
            nodeElement.props.children,
        );
    } else {
        const nodeElement = node as ReactElement<any>;
        return cloneElement(nodeElement, {
            ...props,
            className: twMerge(nodeElement.props?.className, props?.className),
        });
    }
};

// Returns true if there is a single, string child element
export const isSingleStringChild = (children?: ReactNode) => {
    return (
        children &&
        Children.count(children) === 1 &&
        isValidElement(children) &&
        typeof (children as ReactElement<any>).props.children === "string"
    );
};
