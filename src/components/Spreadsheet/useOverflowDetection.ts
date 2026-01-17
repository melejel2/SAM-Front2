import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

export function useOverflowDetection<T extends HTMLElement = HTMLElement>(value: string | number | null | undefined, width?: number) {
  const textRef = useRef<T | null>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);

  const checkOverflow = useCallback(() => {
    const el = textRef.current;
    if (!el) return;
    const overflowing = el.scrollWidth > el.clientWidth + 1;
    setIsOverflowing(overflowing);
  }, []);

  useLayoutEffect(() => {
    checkOverflow();
  }, [value, width, checkOverflow]);

  useEffect(() => {
    const el = textRef.current;
    if (!el) return;
    const resizeObserver = new ResizeObserver(() => checkOverflow());
    resizeObserver.observe(el);
    return () => resizeObserver.disconnect();
  }, [checkOverflow]);

  return { textRef, isOverflowing };
}
