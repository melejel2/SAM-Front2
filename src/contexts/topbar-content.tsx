import React, { createContext, useContext, useState, useCallback, ReactNode, useRef, useEffect } from 'react';

interface TopbarContentState {
  leftContent: ReactNode | null;
  centerContent: ReactNode | null;
  rightContent: ReactNode | null;
}

interface TopbarContentContextType extends TopbarContentState {
  setLeftContent: (content: ReactNode | null) => void;
  setCenterContent: (content: ReactNode | null) => void;
  setRightContent: (content: ReactNode | null) => void;
  clearContent: () => void;
}

const TopbarContentContext = createContext<TopbarContentContextType | null>(null);

export const TopbarContentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [content, setContent] = useState<TopbarContentState>({
    leftContent: null,
    centerContent: null,
    rightContent: null,
  });

  // Track pending updates to debounce rapid changes
  const pendingClearRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);
  const updateCountRef = useRef(0);
  const lastUpdateTimeRef = useRef(0);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (pendingClearRef.current) {
        clearTimeout(pendingClearRef.current);
      }
    };
  }, []);

  // Rate limit updates to prevent infinite loops
  const shouldAllowUpdate = useCallback(() => {
    const now = Date.now();
    if (now - lastUpdateTimeRef.current < 16) { // ~60fps threshold
      updateCountRef.current++;
      if (updateCountRef.current > 50) { // Max 50 updates in rapid succession
        console.warn('TopbarContent: Rate limited to prevent infinite loop');
        return false;
      }
    } else {
      updateCountRef.current = 0;
    }
    lastUpdateTimeRef.current = now;
    return true;
  }, []);

  const setLeftContent = useCallback((leftContent: ReactNode | null) => {
    if (!mountedRef.current) return;
    if (!shouldAllowUpdate()) return;
    // Cancel pending clear when setting new content
    if (pendingClearRef.current && leftContent !== null) {
      clearTimeout(pendingClearRef.current);
      pendingClearRef.current = null;
    }
    setContent(prev => ({ ...prev, leftContent }));
  }, [shouldAllowUpdate]);

  const setCenterContent = useCallback((centerContent: ReactNode | null) => {
    if (!mountedRef.current) return;
    if (!shouldAllowUpdate()) return;
    // Cancel pending clear when setting new content
    if (pendingClearRef.current && centerContent !== null) {
      clearTimeout(pendingClearRef.current);
      pendingClearRef.current = null;
    }
    setContent(prev => ({ ...prev, centerContent }));
  }, [shouldAllowUpdate]);

  const setRightContent = useCallback((rightContent: ReactNode | null) => {
    if (!mountedRef.current) return;
    if (!shouldAllowUpdate()) return;
    // Cancel pending clear when setting new content
    if (pendingClearRef.current && rightContent !== null) {
      clearTimeout(pendingClearRef.current);
      pendingClearRef.current = null;
    }
    setContent(prev => ({ ...prev, rightContent }));
  }, [shouldAllowUpdate]);

  const clearContent = useCallback(() => {
    // Debounce clear to prevent rapid clear/set cycles during route transitions
    if (pendingClearRef.current) {
      clearTimeout(pendingClearRef.current);
    }
    pendingClearRef.current = setTimeout(() => {
      if (mountedRef.current) {
        setContent(prev => {
          if (prev.leftContent === null && prev.centerContent === null && prev.rightContent === null) {
            return prev;
          }
          return { leftContent: null, centerContent: null, rightContent: null };
        });
      }
    }, 0);
  }, []);

  return (
    <TopbarContentContext.Provider
      value={{
        ...content,
        setLeftContent,
        setCenterContent,
        setRightContent,
        clearContent,
      }}
    >
      {children}
    </TopbarContentContext.Provider>
  );
};

export const useTopbarContent = () => {
  const context = useContext(TopbarContentContext);
  if (!context) {
    throw new Error('useTopbarContent must be used within TopbarContentProvider');
  }
  return context;
};

// Hook for pages to set their topbar content
export const useSetTopbarContent = (
  leftContent?: ReactNode,
  centerContent?: ReactNode,
  rightContent?: ReactNode
) => {
  const { setLeftContent, setCenterContent, setRightContent, clearContent } = useTopbarContent();

  // Use refs to store the latest content values without triggering re-renders
  const leftRef = useRef(leftContent);
  const centerRef = useRef(centerContent);
  const rightRef = useRef(rightContent);

  // Update refs when content changes
  leftRef.current = leftContent;
  centerRef.current = centerContent;
  rightRef.current = rightContent;

  useEffect(() => {
    if (leftRef.current !== undefined) setLeftContent(leftRef.current);
    if (centerRef.current !== undefined) setCenterContent(centerRef.current);
    if (rightRef.current !== undefined) setRightContent(rightRef.current);

    return () => {
      clearContent();
    };
    // Only run on mount/unmount - content is accessed via refs
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
};
