/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── Dark surfaces ────────────────────────────────────
        ink: {
          DEFAULT: '#0E0D0D',
          light:   '#1C1B1B',
          lighter: '#2A2929',
        },
        // ── Light / paper surfaces ───────────────────────────
        cream: {
          DEFAULT: '#F2ECE0',
          dark:    '#E6DFD0',
          darker:  '#D5C8B6',
        },
        // ── Dark text on paper ───────────────────────────────
        brown: {
          light:   '#7A6E5E',
          DEFAULT: '#1E1C1A',
          dark:    '#0E0D0D',
        },
        // ── Borders / dividers on paper ──────────────────────
        tan: {
          light:   '#E0D5C4',
          DEFAULT: '#C9B99A',
          dark:    '#A89078',
        },
        // ── Danger / error (red) ─────────────────────────────
        rust: {
          light:   '#D4695A',
          DEFAULT: '#C44B35',
          dark:    '#9E3020',
        },
        // ── Sticker yellow (primary accent) ──────────────────
        yellow: {
          light:   '#EEE270',
          DEFAULT: '#E8D84A',
          dark:    '#C4B432',
        },
        // ── Sage green ───────────────────────────────────────
        sage: {
          light:   '#A3B27B',
          DEFAULT: '#8C9B6B',
          dark:    '#6E7A52',
        },
        // ── Dusty blue ───────────────────────────────────────
        'dusty-blue': {
          light:   '#7AAFC2',
          DEFAULT: '#5B8FA5',
          dark:    '#3E6F80',
        },
      },
      fontFamily: {
        serif: ['"Barlow Condensed"', 'system-ui', 'sans-serif'],
        sans:  ['"DM Sans"', 'system-ui', 'sans-serif'],
        mono:  ['"DM Mono"', 'monospace'],
      },
      borderRadius: {
        'sm':   '3px',
        DEFAULT: '6px',
        'md':   '10px',
        'lg':   '16px',
        'xl':   '22px',
        'pill': '9999px',
      },
      boxShadow: {
        'card':       '4px 4px 0px rgba(0,0,0,0.18)',
        'card-hover': '6px 6px 0px rgba(0,0,0,0.22)',
        'receipt':    '4px 4px 0px rgba(0,0,0,0.20)',
        'sticker':    '2px 2px 0px rgba(0,0,0,0.15)',
      },
      letterSpacing: {
        'widest': '0.18em',
        'ultra':  '0.28em',
      },
      animation: {
        'fade-in':   'fadeIn 0.15s ease-out',
        'slide-up':  'slideUp 0.2s ease-out',
        'slide-down':'slideDown 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%':   { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%':   { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
