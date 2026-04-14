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
        'brutal-sm': '3px 3px 0px #1a1a1a',
        'brutal': '4px 4px 0px #1a1a1a',
        'brutal-lg': '6px 6px 0px #1a1a1a',
        'brutal-xl': '8px 8px 0px #1a1a1a',
        'brutal-terra': '4px 4px 0px #c44b2b',
        'brutal-sage': '4px 4px 0px #7a8b6f',
        'brutal-sun': '4px 4px 0px #FFD43B',
        'brutal-lavender': '4px 4px 0px #B197FC',
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
