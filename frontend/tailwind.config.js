/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          light: '#4B5563',
          DEFAULT: '#1F2937',
          dark: '#111827',
        },
        accent: {
          light: '#F59E0B',
          DEFAULT: '#D97706',
          dark: '#B45309',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}