/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Minimalist Developer — dark-first, near-black + single accent
        ink: {
          950: '#08090B', // page background
          900: '#0C0E12', // elevated background
          800: '#14171D', // cards
          700: '#1D222A', // borders / hover
          600: '#2A303B',
        },
        mist: {
          50: '#F5F7FA', // primary text
          200: '#C8CEDA',
          400: '#8B94A6', // secondary text
          600: '#5C6577', // muted text
        },
        accent: {
          DEFAULT: '#4ADE80', // terminal green
          dim: '#2EA85C',
          glow: 'rgba(74, 222, 128, 0.12)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Fira Code"', 'ui-monospace', 'monospace'],
      },
      maxWidth: {
        content: '52rem',
      },
      animation: {
        'fade-up': 'fadeUp 0.5s ease-out both',
        blink: 'blink 1.2s step-end infinite',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
      },
    },
  },
  plugins: [],
};
