import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

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

  const setLeftContent = useCallback((leftContent: ReactNode | null) => {
    setContent(prev => ({ ...prev, leftContent }));
  }, []);

  const setCenterContent = useCallback((centerContent: ReactNode | null) => {
    setContent(prev => ({ ...prev, centerContent }));
  }, []);

  const setRightContent = useCallback((rightContent: ReactNode | null) => {
    setContent(prev => ({ ...prev, rightContent }));
  }, []);

  const clearContent = useCallback(() => {
    setContent({ leftContent: null, centerContent: null, rightContent: null });
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

  React.useEffect(() => {
    if (leftContent !== undefined) setLeftContent(leftContent);
    if (centerContent !== undefined) setCenterContent(centerContent);
    if (rightContent !== undefined) setRightContent(rightContent);

    return () => {
      clearContent();
    };
  }, [leftContent, centerContent, rightContent, setLeftContent, setCenterContent, setRightContent, clearContent]);
};
