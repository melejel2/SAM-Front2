import React, { createContext, useContext, useState, useCallback, useEffect } from "react";

interface ArchiveContextType {
    isArchiveMode: boolean;
    setArchiveMode: (value: boolean) => void;
    toggleArchiveMode: () => void;
}

const ArchiveContext = createContext<ArchiveContextType | undefined>(undefined);

export const ArchiveProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Initialize from localStorage
    const [isArchiveMode, setIsArchiveModeState] = useState<boolean>(() => {
        const stored = localStorage.getItem("__SAM_ARCHIVE_MODE__");
        return stored === "true";
    });

    // Update localStorage synchronously when archive mode changes
    const setArchiveMode = useCallback((value: boolean) => {
        setIsArchiveModeState(value);
        // Update localStorage synchronously to ensure API interceptor gets the latest value
        localStorage.setItem("__SAM_ARCHIVE_MODE__", String(value));
        // Dispatch custom event to notify components
        window.dispatchEvent(new Event("archiveModeChanged"));
    }, []);

    const toggleArchiveMode = useCallback(() => {
        setIsArchiveModeState((prev) => !prev);
    }, []);

    return (
        <ArchiveContext.Provider value={{ isArchiveMode, setArchiveMode, toggleArchiveMode }}>
            {children}
        </ArchiveContext.Provider>
    );
};

export const useArchive = () => {
    const context = useContext(ArchiveContext);
    if (!context) {
        // Return default values instead of throwing error to prevent hook issues
        return {
            isArchiveMode: false,
            setArchiveMode: () => {},
            toggleArchiveMode: () => {},
        };
    }
    return context;
};
