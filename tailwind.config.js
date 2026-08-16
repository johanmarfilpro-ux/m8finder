/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef4ff',
          100: '#d9e6ff',
          200: '#b3ccff',
          300: '#80a9ff',
          400: '#4d7fff',
          500: '#265cf2',
          600: '#1a44c9',
          700: '#17389e',
          800: '#152f7a',
          900: '#0f1f52',
        },
        surface: {
          DEFAULT: '#0b1120',
          soft: '#111a2e',
          border: '#1f2b45',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Segoe UI', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
