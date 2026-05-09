import type { Config } from 'tailwindcss';
import forms from '@tailwindcss/forms';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#6366f1',
        secondary: '#8b5cf6',
        accent: '#06b6d4',
        dark: '#1e293b',
        light: '#f1f5f9',
      },
      fontFamily: {
        sans: ['Outfit', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
      },
      screens: {
        '3xl': '1920px',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-15px)' },
        },
        pulseShadow: {
          '0%, 100%': { 'box-shadow': '0 0 0 0 rgba(99, 102, 241, 0.7)' },
          '50%': { 'box-shadow': '0 0 0 20px rgba(99, 102, 241, 0)' },
        },
        slideIn: {
          '0%': { transform: 'translateY(30px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        gradientFlow: {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
      },
      animation: {
        float: 'float 6s ease-in-out infinite',
        pulseShadow: 'pulseShadow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        slideIn: 'slideIn 0.8s ease-out forwards',
        gradientFlow: 'gradientFlow 3s ease infinite',
      },
      backgroundImage: {
        'gradient-radial':
          'radial-gradient(circle at center, #6366f1 0%, #8b5cf6 50%, #06b6d4 100%)',
        'gradient-diagonal': 'linear-gradient(135deg, #6366f1, #8b5cf6, #06b6d4)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        '3xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        'inner-light': 'inset 0 2px 4px 0 rgba(255, 255, 255, 0.2)',
      },
    },
  },
  plugins: [forms],
} satisfies Config;
