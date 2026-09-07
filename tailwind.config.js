/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'accent-blue': '#00bcd4',
        'accent-pink': '#e91e63',
        'accent-gold': '#ffc107',
        'accent-green': '#8bc34a',
        'peg': '#795548',
        'text-dark': '#3e2723',
      },
      fontFamily: {
        'sans': ['"Fredoka One"', 'cursive', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
