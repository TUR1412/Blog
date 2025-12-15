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
      typography: () => ({
        xuantian: {
          css: {
            '--tw-prose-body': 'hsl(var(--fg) / 0.9)',
            '--tw-prose-headings': 'hsl(var(--fg) / 0.96)',
            '--tw-prose-lead': 'hsl(var(--fg) / 0.92)',
            '--tw-prose-links': 'hsl(var(--accent) / 0.95)',
            '--tw-prose-bold': 'hsl(var(--fg) / 0.98)',
            '--tw-prose-counters': 'hsl(var(--muted) / 0.75)',
            '--tw-prose-bullets': 'hsl(var(--border) / 0.9)',
            '--tw-prose-hr': 'hsl(var(--border) / 0.55)',
            '--tw-prose-quotes': 'hsl(var(--fg) / 0.92)',
            '--tw-prose-quote-borders': 'hsl(var(--accent2) / 0.35)',
            '--tw-prose-captions': 'hsl(var(--muted) / 0.75)',
            '--tw-prose-code': 'hsl(var(--fg) / 0.92)',
            '--tw-prose-pre-code': 'hsl(var(--fg) / 0.9)',
            '--tw-prose-pre-bg': 'rgba(0, 0, 0, 0.22)',
            '--tw-prose-th-borders': 'hsl(var(--border) / 0.7)',
            '--tw-prose-td-borders': 'hsl(var(--border) / 0.55)',

            fontFamily:
              "ui-serif, 'Iowan Old Style', 'Songti SC', 'STSong', 'SimSun', 'Noto Serif CJK SC', serif",

            a: {
              textDecoration: 'none',
              borderBottom: '1px solid hsl(var(--accent) / 0.35)',
              paddingBottom: '0.12em',
              transition: 'border-color 140ms ease, color 140ms ease',
            },
            'a:hover': {
              color: 'hsl(var(--accent) / 1)',
              borderBottomColor: 'hsl(var(--accent2) / 0.55)',
            },

            p: { lineHeight: '1.85' },

            'ul > li::marker': { color: 'hsl(var(--accent2) / 0.7)' },
            'ol > li::marker': { color: 'hsl(var(--accent) / 0.7)' },

            h1: { letterSpacing: '-0.02em' },
            h2: {
              letterSpacing: '-0.02em',
              position: 'relative',
              paddingLeft: '0.95rem',
              paddingBottom: '0.35rem',
              borderBottom: '1px solid hsl(var(--border) / 0.55)',
            },
            'h2::before': {
              content: '""',
              position: 'absolute',
              left: '0',
              top: '0.72em',
              width: '0.55rem',
              height: '0.55rem',
              borderRadius: '999px',
              background:
                'linear-gradient(135deg, hsl(var(--accent) / 0.9), hsl(var(--accent2) / 0.75))',
              boxShadow: '0 0 0 4px hsl(var(--ring) / 0.14)',
            },
            'h2::after': {
              content: '""',
              position: 'absolute',
              left: '0.95rem',
              right: '0',
              bottom: '-1px',
              height: '1px',
              background:
                'linear-gradient(90deg, hsl(var(--accent) / 0.7), hsl(var(--accent2) / 0.35), transparent 72%)',
            },

            h3: {
              letterSpacing: '-0.01em',
              position: 'relative',
              paddingLeft: '0.78rem',
            },
            'h3::before': {
              content: '""',
              position: 'absolute',
              left: '0',
              top: '0.78em',
              width: '0.42rem',
              height: '0.42rem',
              borderRadius: '999px',
              background: 'hsl(var(--accent2) / 0.55)',
              boxShadow: '0 0 0 3px hsl(var(--ring) / 0.12)',
            },

            blockquote: {
              fontStyle: 'normal',
              borderLeftWidth: '2px',
              borderLeftColor: 'hsl(var(--accent2) / 0.35)',
              background: 'linear-gradient(180deg, rgba(255,255,255,.06), rgba(255,255,255,.03))',
              borderRadius: '16px',
              padding: '0.9rem 1rem',
              position: 'relative',
              overflow: 'hidden',
            },
            'blockquote::before': {
              content: '"「"',
              position: 'absolute',
              left: '0.6rem',
              top: '0.1rem',
              fontSize: '3rem',
              lineHeight: '1',
              color: 'hsl(var(--accent2) / 0.22)',
              pointerEvents: 'none',
            },
            'blockquote p:first-of-type::before': { content: 'none' },
            'blockquote p:last-of-type::after': { content: 'none' },

            code: {
              fontWeight: '500',
              borderRadius: '10px',
              padding: '0.2em 0.45em',
              background: 'rgba(255,255,255,.06)',
              border: '1px solid hsl(var(--border) / 0.65)',
            },
            'pre code': {
              background: 'transparent',
              border: 'none',
              padding: '0',
              borderRadius: '0',
              fontWeight: '500',
            },
            'code::before': { content: 'none' },
            'code::after': { content: 'none' },

            mark: {
              color: 'hsl(var(--fg) / 0.96)',
              background:
                'linear-gradient(120deg, hsl(var(--accent) / 0.26), hsl(var(--accent2) / 0.20))',
              backgroundSize: '220% 220%',
              backgroundPosition: '0% 50%',
              borderRadius: '12px',
              padding: '0.12em 0.38em',
              border: '1px solid hsl(var(--border) / 0.65)',
              boxShadow: '0 16px 48px rgba(0,0,0,.18)',
              transition:
                'background-position 380ms ease, border-color 180ms ease, box-shadow 200ms ease, transform 180ms ease',
            },
            'mark[data-x-active="1"]': {
              background:
                'linear-gradient(120deg, hsl(var(--accent) / 0.36), hsl(var(--accent2) / 0.28))',
              backgroundSize: '220% 220%',
              borderColor: 'hsl(var(--ring) / 0.55)',
              boxShadow: '0 0 0 4px hsl(var(--ring) / 0.18), 0 18px 60px rgba(0,0,0,.22)',
              backgroundPosition: '100% 50%',
              animation: 'xuantian-shimmer 5.4s ease-in-out infinite',
              transform: 'translateY(-1px)',
            },

            pre: {
              borderRadius: '18px',
              border: '1px solid hsl(var(--border) / 0.7)',
              background:
                'radial-gradient(1200px 300px at 20% 0%, hsl(var(--accent) / .12), transparent 55%), radial-gradient(900px 240px at 80% 0%, hsl(var(--accent2) / .12), transparent 50%), rgba(0,0,0,.22)',
              boxShadow: '0 22px 70px rgba(0,0,0,.38)',
              position: 'relative',
              overflow: 'hidden',
            },
            'pre::before': {
              content: '""',
              position: 'absolute',
              left: '0',
              right: '0',
              top: '0',
              height: '1px',
              background: 'linear-gradient(90deg, transparent, hsl(var(--accent) / 0.6), transparent)',
              opacity: '0.7',
              pointerEvents: 'none',
            },

            hr: {
              borderTopColor: 'hsl(var(--border) / 0.55)',
              marginTop: '2.2em',
              marginBottom: '2.2em',
              position: 'relative',
              overflow: 'visible',
            },
            'hr::after': {
              content: '"◆"',
              position: 'absolute',
              left: '50%',
              top: '-0.95em',
              transform: 'translateX(-50%)',
              padding: '0.12em 0.55em',
              fontSize: '0.75rem',
              color: 'hsl(var(--muted) / 0.85)',
              border: '1px solid hsl(var(--border) / 0.65)',
              borderRadius: '999px',
              background: 'linear-gradient(180deg, rgba(255,255,255,.09), rgba(255,255,255,.04))',
              boxShadow: '0 18px 60px rgba(0,0,0,.22)',
              pointerEvents: 'none',
            },

            img: {
              borderRadius: '18px',
              border: '1px solid hsl(var(--border) / 0.65)',
              boxShadow: '0 22px 70px rgba(0,0,0,.28)',
            },

            kbd: {
              fontFamily:
                "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
              fontSize: '0.85em',
              borderRadius: '10px',
              padding: '0.18em 0.45em',
              border: '1px solid hsl(var(--border) / 0.65)',
              background: 'rgba(255,255,255,.05)',
              boxShadow: 'inset 0 -2px 0 hsl(var(--border) / 0.5)',
            },

            details: {
              border: '1px solid hsl(var(--border) / 0.65)',
              borderRadius: '16px',
              padding: '0.85rem 1rem',
              background: 'linear-gradient(180deg, rgba(255,255,255,.06), rgba(255,255,255,.03))',
            },
            summary: {
              cursor: 'pointer',
              fontWeight: '600',
              color: 'hsl(var(--fg) / 0.92)',
            },
          },
        },
      }),
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
