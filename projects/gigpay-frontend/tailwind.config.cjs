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
      },
      fontFamily: {
        serif: ['"Instrument Serif"', 'Georgia', 'serif'],
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      animation: {
        'ticker': 'ticker 30s linear infinite',
        'fade-up': 'fadeUp 0.8s ease-out forwards',
        'fade-up-delay-1': 'fadeUp 0.8s ease-out 0.15s forwards',
        'fade-up-delay-2': 'fadeUp 0.8s ease-out 0.3s forwards',
        'fade-up-delay-3': 'fadeUp 0.8s ease-out 0.45s forwards',
        'slide-in-left': 'slideInLeft 0.6s ease-out forwards',
        'pulse-slow': 'pulse 4s ease-in-out infinite',
      },
      keyframes: {
        ticker: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
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
