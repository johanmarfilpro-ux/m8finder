/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        yang: {
          50: '#ffffff',
          100: '#f4f4f5',
          200: '#e4e4e7',
          300: '#d4d4d8',
          400: '#a1a1aa',
          500: '#71717a',
          600: '#52525b',
          700: '#3f3f46',
          800: '#27272a',
          900: '#18181b',
        },
        yin: {
          50: '#f5f5f6',
          100: '#e5e5e7',
          200: '#c4c4c9',
          300: '#8f8f99',
          400: '#55555f',
          500: '#26262e',
          600: '#1a1a20',
          700: '#131317',
          800: '#0d0d10',
          900: '#08080a',
        },
        surface: {
          DEFAULT: '#0a0a0b',
          soft: '#151517',
          border: '#28282c',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Segoe UI', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
