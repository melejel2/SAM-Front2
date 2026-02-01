import { useCallback, useState } from "react";

export const useLocalStorage = <T>(key: string, initialValue: T) => {
    const [storedValue, setStoredValue] = useState<T>(() => {
        const item = window.localStorage.getItem(key);
        return item ? ({ ...initialValue, ...JSON.parse(item) } as T) : initialValue;
    });

    const setValue = useCallback((value: T | ((val: T) => T)) => {
        try {
            setStoredValue(prev => {
                const valueToStore = value instanceof Function ? value(prev) : value;
                if (key) {
                    window.localStorage.setItem(key, JSON.stringify(valueToStore));
                }
                return valueToStore;
            });
        } catch (error) {
            console.error(error);
        }
    }, [key]);
    return [storedValue, setValue] as const;
};
