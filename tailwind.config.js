/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./site/index.html', './scripts/site/**/*.mjs', './index.html'],
  theme: {
    extend: {
      colors: {
        obsidian: '#08090A',
        panel: '#101216',
        card: '#14161C',
        border: '#232630',
        gold: '#C5A880',
        emerald: '#10B981',
        cobalt: '#3B82F6'
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        cinzel: ['Cinzel', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace']
      }
    }
  },
  plugins: []
};
