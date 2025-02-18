// utils.ts
import {
  cloneElement,
  Fragment,
  isValidElement,
  ReactElement,
  ReactNode,
} from 'react';
import { twMerge } from 'tailwind-merge';

interface BaseProps {
  className?: string;
  children?: ReactNode;
  [key: string]: any;
}

interface WrapperProps extends BaseProps {
  onClick?: () => void;
}

export const wrapElement = ({
  node,
  wrapper,
  props = {},
}: {
  node: ReactNode;
  wrapper: ReactElement<any>;
  props?: WrapperProps;
}): ReactElement => {
  if (!node) {
    return cloneElement(wrapper, props);
  }

  if (!isValidElement(node)) {
    return cloneElement(wrapper, props, node);
  }

  const nodeElement = node as ReactElement<BaseProps>;

  if (isReactFragment(nodeElement)) {
    return cloneElement(
      wrapper,
      {
        ...props,
        className: twMerge(
          nodeElement.props?.className,
          props.className
        ),
      },
      nodeElement.props.children
    );
  }

  return cloneElement(
    nodeElement,
    {
      ...props,
      className: twMerge(
        nodeElement.props?.className,
        props.className
      ),
    },
    nodeElement.props.children
  );
};

function isReactFragment(node: ReactElement): boolean {
  return node.type === Fragment;
}

// Utility function (if needed)
export const isSingleStringChild = (children: ReactNode): boolean => {
  return typeof children === 'string';
};

// *** New Function: wrapWithElementIfInvalid ***
interface WrapWithElementOptions {
  node: ReactNode | ReactNode[];
  wrapper: ReactElement;
  props: {
    className: string;
  };
}

export function wrapWithElementIfInvalid({
  node,
  wrapper,
  props,
}: WrapWithElementOptions): ReactNode | ReactNode[] {
  if (Array.isArray(node)) {
    return node.map((child, index) => {
      if (isValidElement(child)) {
        // Cast child to ReactElement<BaseProps> to inform TypeScript about its structure
        const childElement = child as ReactElement<BaseProps>;

        // Ensure that childElement.props is an object before spreading
        const existingClassName = childElement.props.className || '';
        const newClassName = `${existingClassName} ${props.className}`.trim();

        return cloneElement(childElement, {
          ...childElement.props, // childElement.props is now known to be BaseProps
          className: newClassName,
        });
      } else {
        // For non-React elements, wrap them with the provided wrapper and apply props
        return cloneElement(wrapper, { ...props, key: index }, child);
      }
    });
  }

  if (isValidElement(node)) {
    // Cast node to ReactElement<BaseProps> to inform TypeScript about its structure
    const nodeElement = node as ReactElement<BaseProps>;

    // Ensure that nodeElement.props is an object before spreading
    const existingClassName = nodeElement.props.className || '';
    const newClassName = `${existingClassName} ${props.className}`.trim();

    return cloneElement(nodeElement, {
      ...nodeElement.props, // nodeElement.props is now known to be BaseProps
      className: newClassName,
    });
  }

  // If node is not a valid React element, wrap it with the provided wrapper
  return cloneElement(wrapper, { ...props, key: 0 }, node);
}
