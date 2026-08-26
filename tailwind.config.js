export default {content: [
  './index.html',
  './src/**/*.{js,ts,jsx,tsx}'
],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#f59e0b',
          500: '#d97706',
          600: '#b45309',
          700: '#92400e',
          800: '#78350f',
          900: '#1e293b',
        },
        surface: {
          page: '#f8fafc',
          card: '#ffffff',
          panel: '#e2e8f0',
          sunken: '#f1f5f9',
        },
        ink: {
          900: '#0f172a',
          700: '#334155',
          500: '#64748b',
          300: '#94a3b8',
        },
        win: {
          green: '#10b981',
          red: '#f43f5e',
          violet: '#8b5cf6',
          gold: '#f59e0b',
        },
      },
      fontFamily: {
        sans: ['Manrope', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Sora', 'Manrope', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px rgba(15, 23, 42, 0.08), 0 8px 24px -16px rgba(15, 23, 42, 0.16)',
        lift: '0 12px 32px -10px rgba(217, 119, 6, 0.35)',
      },
      transitionTimingFunction: {
        smooth: 'cubic-bezier(0.23, 1, 0.32, 1)',
      },
    },
  },
}
