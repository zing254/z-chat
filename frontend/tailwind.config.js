/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'bg-void': '#0A0A0F',
        'surface': '#131318',
        'surface-dim': '#0e0e13',
        'surface-bright': '#39383e',
        'glass-bg': 'rgba(255, 255, 255, 0.05)',
        'glass-border': 'rgba(255, 255, 255, 0.06)',
        'neon-cyan': '#00F0FF',
        'neon-violet': '#B026FF',
        'danger-orange': '#FF4500',
        'text-primary': '#FFFFFF',
        'text-meta': '#A1A1AA',
        'text-placeholder': '#52525B',
        'primary-container': '#00f0ff',
        'secondary-container': '#a100f0',
        'surface-container': '#1f1f25',
        'surface-container-low': '#1b1b20',
        'surface-container-high': '#2a292f',
        'surface-container-highest': '#35343a',
        'on-surface': '#e4e1e9',
        'on-surface-variant': '#b9cacb',
        'outline': '#849495',
        'outline-variant': '#3b494b',
      },
      fontFamily: {
        'space': ['Space Grotesk', 'sans-serif'],
        'body': ['Inter', 'sans-serif'],
        'mono': ['Space Mono', 'monospace'],
      },
      backdropBlur: {
        glass: '24px',
      },
      borderRadius: {
        bubble: '24px',
      },
      animation: {
        'shimmer': 'shimmer 2s linear infinite',
        'pulse-neon': 'pulse-neon 2s cubic-bezier(0.4, 0.6, 1, 1) infinite',
        'breath': 'breath 1.5s ease-in-out infinite',
        'slide-down': 'slide-down 0.3s ease-out',
        'slide-up': 'slide-up 0.3s ease-out',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'pulse-neon': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        breath: {
          '0%, 100%': { transform: 'scaleX(1)' },
          '50%': { transform: 'scaleX(1.3)' },
        },
        'slide-down': {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(0)' },
          '100%': { transform: 'translateY(-100%)' },
        },
      },
    },
  },
  plugins: [],
};