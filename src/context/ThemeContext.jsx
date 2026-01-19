import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
    const [theme, setTheme] = useState(() => {
        const saved = localStorage.getItem('theme');
        return saved || 'light';
    });

    const [transitions, setTransitions] = useState(() => {
        const saved = localStorage.getItem('theme-transitions');
        return saved !== 'false'; // Default to true
    });

    // Apply theme
    useEffect(() => {
        const root = document.documentElement;

        // Apply dark class for Tailwind
        if (theme === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }

        // Apply transition settings
        root.style.setProperty('--theme-transition', transitions ? '50ms' : '0ms');

        // Save to localStorage
        localStorage.setItem('theme', theme);
    }, [theme, transitions]);

    useEffect(() => {
        localStorage.setItem('theme-transitions', transitions);
    }, [transitions]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'light' ? 'dark' : 'light');
    };

    return (
        <ThemeContext.Provider value={{
            theme,
            toggleTheme,
            transitions,
            setTransitions
        }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}
