/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#4285F4',
          hover: '#3c78d8',
        },
        background: {
          light: '#F8F9FA',
          dark: '#121212',
        },
        surface: {
          light: '#FFFFFF',
          dark: '#1E1E1E',
        },
        text: {
          'on-light': '#202124',
          'on-dark': '#E8EAED',
          'on-dark-secondary': '#969BA1',
        },
        border: {
          light: '#E0E0E0',
          dark: '#3C4043',
        }
      },
      fontFamily: {
        display: ["Inter", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "0.75rem",
        lg: "1rem",
        full: "9999px",
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    // require('@tailwindcss/typography'), // Temporarily disabled
  ],
}