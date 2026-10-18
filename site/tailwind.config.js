/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./site/index.html', './scripts/site/**/*.mjs', './index.html'],
  theme: {
    extend: {
      colors: {
        obsidian: '#05070B',
        carbon: '#0A0D14',
        panel: '#111724',
        card: '#111724',
        border: '#232630',
        gold: '#C5A880',
        emerald: '#10B981',
        cobalt: '#3B82F6',
        cyberEmerald: '#10B981',
        cyberGold: '#F59E0B',
        cyberCyan: '#00F0FF',
        cyberRose: '#F43F5E'
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
