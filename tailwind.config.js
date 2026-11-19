/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        blue: {
          50: '#eef5fb',
          100: '#d9e8f5',
          200: '#b8d3ec',
          300: '#8dbfe9',
          400: '#6ca9dc',
          500: '#4a8cc6',
          600: '#2f6fa8',
          700: '#255a89',
          800: '#1f4a71',
          900: '#183a58',
        },
      },
    },
  },
  plugins: [],
}