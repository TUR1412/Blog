/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'hsl(var(--bg) / <alpha-value>)',
        fg: 'hsl(var(--fg) / <alpha-value>)',
        muted: 'hsl(var(--muted) / <alpha-value>)',
        card: 'hsl(var(--card) / <alpha-value>)',
        border: 'hsl(var(--border) / <alpha-value>)',
        ring: 'hsl(var(--ring) / <alpha-value>)',
        accent: 'hsl(var(--accent) / <alpha-value>)',
        accent2: 'hsl(var(--accent2) / <alpha-value>)',
        good: 'hsl(var(--good) / <alpha-value>)',
        warn: 'hsl(var(--warn) / <alpha-value>)',
        bad: 'hsl(var(--bad) / <alpha-value>)',
      },
      borderRadius: {
        xl2: '1.25rem',
      },
      boxShadow: {
        glass: '0 24px 80px rgba(0,0,0,.35)',
        lift: '0 18px 60px rgba(0,0,0,.30)',
      },
      backdropBlur: {
        xl2: '28px',
      },
      keyframes: {
        floaty: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '0% 50%' },
          '100%': { backgroundPosition: '100% 50%' },
        },
      },
      animation: {
        floaty: 'floaty 6s ease-in-out infinite',
        shimmer: 'shimmer 6s ease-in-out infinite',
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};

