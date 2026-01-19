import { create } from 'zustand';

const useThemeStore = create((set) => ({
  theme: typeof window !== 'undefined' ? (localStorage.getItem('theme') || 'light') : 'light',
  toggleTheme: () => set((state) => {
    const newTheme = state.theme === 'light' ? 'dark' : 'light';
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', newTheme);
    }
    return { theme: newTheme };
  }),
  setTheme: (theme) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', theme);
    }
    return set({ theme });
  },
}));

export default useThemeStore;
