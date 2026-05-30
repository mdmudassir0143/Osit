/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        charcoal: '#1a1a1a',
        soot: '#111111',
        cream: '#f5f0e8',
        sand: '#e8e0d4',
        terra: '#c44b2b',
        'terra-dark': '#a33d24',
        'terra-light': '#f4e8e4',
        sage: '#7a8b6f',
        'sage-light': '#e8ede5',
        slate: '#2a2a2a',
        ash: '#3a3a3a',
        surface: '#fafaf8',
        'surface-raised': '#ffffff',
        border: '#e5e2dc',
        'border-light': '#f0ede8',
        muted: '#8a8680',
        sun: '#FFD43B',
        'sun-light': '#FFF3BF',
        lavender: '#B197FC',
      },
      fontFamily: {
        display: ['"Syne"', 'system-ui', 'sans-serif'],
        serif: ['"Instrument Serif"', 'Georgia', 'serif'],
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        // Soft, diffuse shadows (modern, matches the landing aesthetic).
        // Names kept for backwards-compat with existing dashboard markup.
        'brutal-sm': '0 4px 16px -8px rgba(26,26,26,0.20)',
        'brutal': '0 12px 30px -16px rgba(26,26,26,0.28)',
        'brutal-lg': '0 24px 50px -28px rgba(26,26,26,0.35)',
        'brutal-xl': '0 32px 64px -32px rgba(26,26,26,0.4)',
        'brutal-terra': '0 16px 36px -18px rgba(196,75,43,0.42)',
        'brutal-sage': '0 16px 36px -18px rgba(122,139,111,0.42)',
        'brutal-sun': '0 16px 36px -18px rgba(255,212,59,0.5)',
        'brutal-lavender': '0 16px 36px -18px rgba(177,151,252,0.5)',
      },
      animation: {
        'ticker': 'ticker 30s linear infinite',
        'fade-up': 'fadeUp 0.6s ease-out forwards',
        'fade-up-delay-1': 'fadeUp 0.6s ease-out 0.1s forwards',
        'fade-up-delay-2': 'fadeUp 0.6s ease-out 0.2s forwards',
        'fade-up-delay-3': 'fadeUp 0.6s ease-out 0.3s forwards',
        'slide-in-left': 'slideInLeft 0.6s ease-out forwards',
        'pulse-slow': 'pulse 4s ease-in-out infinite',
      },
      keyframes: {
        ticker: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-40px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
    },
  },
  daisyui: {
    themes: ['lofi'],
    logs: false,
  },
  plugins: [require('daisyui')],
}
