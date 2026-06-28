import { useTheme } from '../../context/ThemeContext';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all group relative flex items-center justify-center"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
            {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-500" />
            ) : (
                <Moon className="w-4 h-4 text-slate-500 dark:text-slate-350" />
            )}

            {/* Tooltip */}
            <span className="absolute right-0 top-full mt-2 px-2 py-1 bg-slate-900 dark:bg-slate-800 text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 whitespace-nowrap pointer-events-none z-50 shadow-md">
                {theme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}
            </span>
        </button>
    );
}
