/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Theme-aware colors using CSS variables
        'theme-primary': 'var(--color-primary)',
        'theme-surface': 'var(--color-surface)',
        'theme-surface-alt': 'var(--color-surfaceAlt)',
        'theme-text': 'var(--color-text)',
        'theme-text-secondary': 'var(--color-textSecondary)',
        'theme-border': 'var(--color-border)',
      },
      transitionDuration: {
        'theme': 'var(--theme-transition)',
      },
      transitionProperty: {
        'theme': 'background-color, border-color, color, fill, stroke, opacity',
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, rgb(88, 101, 242), rgb(71, 82, 196))',
        'gradient-primary-dark': 'linear-gradient(135deg, rgb(71, 82, 196), rgb(58, 67, 163))',
      }
    },
  },
  plugins: [],
}