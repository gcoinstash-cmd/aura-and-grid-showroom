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
        cyberAmber: '#FF9F0A',
        cyberCyan: '#00F0FF',
        cyberRose: '#F43F5E'
      },
      fontSize: {
        xs: ['0.875rem', { lineHeight: '1.35rem' }],
        sm: ['0.95rem', { lineHeight: '1.45rem' }],
        base: ['1.0625rem', { lineHeight: '1.65rem' }],
        lg: ['1.225rem', { lineHeight: '1.75rem' }],
        xl: ['1.38rem', { lineHeight: '1.9rem' }],
        '2xl': ['1.68rem', { lineHeight: '2.15rem' }],
        '3xl': ['2.07rem', { lineHeight: '2.45rem' }],
        '4xl': ['2.58rem', { lineHeight: '2.85rem' }],
        '5xl': ['3.45rem', { lineHeight: '1.08' }],
        '6xl': ['4.15rem', { lineHeight: '1.06' }]
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

