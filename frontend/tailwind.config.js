/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['Newsreader', 'Georgia', 'serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        brand: {
          50: '#f0f5fa',
          100: '#e1ecf5',
          200: '#c3daec',
          300: '#95bede',
          400: '#5e9dcc',
          500: '#347eb8',
          600: '#23649b',
          700: '#1d517e',
          800: '#1a4469',
          900: '#0f2744',
          950: '#0a1a2e',
        },
        parchment: '#fbfbfa',
      },
      boxShadow: {
        'soft': '0 2px 8px -2px rgba(15, 39, 68, 0.05), 0 1px 3px -1px rgba(15, 39, 68, 0.03)',
        'card': '0 4px 20px -2px rgba(15, 39, 68, 0.06), 0 2px 6px -1px rgba(15, 39, 68, 0.03)',
        'elevated': '0 12px 32px -4px rgba(15, 39, 68, 0.1), 0 4px 12px -2px rgba(15, 39, 68, 0.04)',
      },
    },
  },
  plugins: [],
}
