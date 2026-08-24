export default {content: [
  './index.html',
  './src/**/*.{js,ts,jsx,tsx}'
],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f2edff',
          100: '#e5daff',
          200: '#cbb5ff',
          300: '#ab88ff',
          400: '#8a5cf6',
          500: '#6d3ff3',
          600: '#5a2fd8',
          700: '#4823ab',
          800: '#351a7e',
          900: '#241157',
        },
        surface: {
          page: '#f2f4f8',
          card: '#ffffff',
          panel: '#dfe3ec',
          sunken: '#e7eaf1',
        },
        ink: {
          900: '#141726',
          700: '#3d4359',
          500: '#6b7286',
          300: '#9aa1b4',
        },
        win: {
          green: '#12b76a',
          red: '#f04438',
          violet: '#7a3ff0',
          gold: '#f5a623',
        },
      },
      fontFamily: {
        sans: ['Manrope', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Sora', 'Manrope', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(20, 23, 38, 0.06), 0 8px 24px -16px rgba(20, 23, 38, 0.24)',
        lift: '0 12px 32px -12px rgba(109, 63, 243, 0.45)',
      },
      transitionTimingFunction: {
        smooth: 'cubic-bezier(0.23, 1, 0.32, 1)',
      },
    },
  },
}
