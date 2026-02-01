import { useLayoutEffect, useRef, useState } from "react";

export function useOverflowDetection<T extends HTMLElement = HTMLElement>(value: string | number | null | undefined, width?: number) {
  const textRef = useRef<T | null>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);

  // Check overflow only when value or column width changes.
  // ResizeObserver was removed because it caused an oscillation loop:
  // toggling isOverflowing changed the DOM structure, which triggered
  // the observer on the detaching element, reading the new ref with
  // different layout, flipping the state back → infinite re-render.
  // Column width is already passed as a prop, so explicit resize
  // observation is unnecessary.
  useLayoutEffect(() => {
    const el = textRef.current;
    if (!el) {
      setIsOverflowing(false);
      return;
    }
    const overflowing = el.scrollWidth > el.clientWidth + 1;
    setIsOverflowing(prev => prev !== overflowing ? overflowing : prev);
  }, [value, width]);

  return { textRef, isOverflowing };
}
