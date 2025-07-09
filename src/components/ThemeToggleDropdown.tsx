import { useConfig } from "@/contexts/config";
import Icon from "@/components/Icon";
import { useEffect, useState } from "react";
import { useLocalStorage } from "@/hooks/use-local-storage";

// Use string icon names instead of importing icon objects

type IThemeToggleDropdown = {
    triggerClass?: string;
    iconClass?: string;
};

export const ThemeToggleDropdown = ({
    triggerClass,
    iconClass,
}: IThemeToggleDropdown) => {
    const { config, changeTheme } = useConfig();

    const [currentSystemTheme, setCurrentSystemTheme] = useState<'light' | 'dark'>(
        window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    );

    // Helper function to convert any theme to light/dark
    const getEffectiveTheme = (theme: string): 'light' | 'dark' => {
        if (theme === 'dark' || theme === 'dim') return 'dark';
        return 'light';
    };

    const [effectiveTheme, setEffectiveTheme] = useLocalStorage('__SAM_PORTAL_THEME__', 
        config.theme === 'system' ? currentSystemTheme : getEffectiveTheme(config.theme));

    useEffect(() => {
        const isSystemTheme = config.theme === 'system';
        const newTheme = isSystemTheme ? currentSystemTheme : config.theme;

        setEffectiveTheme(getEffectiveTheme(newTheme));

        const htmlElement = document.documentElement;
        htmlElement.setAttribute('data-theme', newTheme);

        if (newTheme === 'dark') {
            htmlElement.classList.add('dark');
            htmlElement.classList.remove('light');
        } else {
            htmlElement.classList.add('light');
            htmlElement.classList.remove('dark');
        }
    }, [config.theme, currentSystemTheme, setEffectiveTheme]);

    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

        const handleChange = (e: MediaQueryListEvent) => {
            const newSystemTheme = e.matches ? 'dark' : 'light';
            setCurrentSystemTheme(newSystemTheme);

            if (config.theme === 'system') {
                setEffectiveTheme(newSystemTheme);

                const htmlElement = document.documentElement;
                htmlElement.setAttribute('data-theme', newSystemTheme);

                if (newSystemTheme === 'dark') {
                    htmlElement.classList.add('dark');
                    htmlElement.classList.remove('light');
                } else {
                    htmlElement.classList.add('light');
                    htmlElement.classList.remove('dark');
                }
            }
        };

        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, [config.theme, setEffectiveTheme]);

    const handleToggle = () => {
        const newTheme = config.theme === 'dark' ? 'light' : 'dark';

        // Update the config theme
        changeTheme(newTheme);
        
        // Update local storage
        setEffectiveTheme(getEffectiveTheme(newTheme));

        const htmlElement = document.documentElement;
        htmlElement.setAttribute('data-theme', newTheme);

        if (newTheme === 'dark') {
            htmlElement.classList.add('dark');
            htmlElement.classList.remove('light');
        } else {
            htmlElement.classList.add('light');
            htmlElement.classList.remove('dark');
        }
    };

    const isEffectivelyDark = 
        config.theme === 'dark' || 
        (config.theme === 'system' && currentSystemTheme === 'dark');

    // Use the custom styling provided in the design
    return (
        <div className="relative group">
            <button
                onClick={handleToggle}
                className={triggerClass || "btn btn-circle btn-ghost btn-sm relative overflow-hidden hover:bg-base-300 transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-base-300 cursor-pointer"}
                aria-label="Toggle theme"
                type="button"
            >
                <Icon
                    icon={isEffectivelyDark ? "sun" : "moon"}
                    fontSize={5}
                    className={iconClass || "text-base-content group-hover:text-base-content/70 transition-all duration-200 group-hover:rotate-6"}
                />
            </button>
        </div>
    );
};
