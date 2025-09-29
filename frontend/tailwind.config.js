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
          DEFAULT: '#0c7ff2',
          hover: '#0a68c4',
        },
        'primary-text': '#111418',
        'secondary-text': '#60758a',
        background: '#ffffff',
        'card-background': '#f8f9fa',
        accent: '#e9ecef',
      },
      fontFamily: {
        sans: ['Manrope', 'Noto Sans', 'sans-serif'],
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/container-queries'),
  ],
}
