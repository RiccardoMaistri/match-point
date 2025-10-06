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
          DEFAULT: '#2563eb',
          hover: '#1d4ed8',
        },
        'primary-text': '#1e293b',
        'secondary-text': '#64748b',
        background: '#f8fafc',
        'card-background': '#ffffff',
        accent: '#e2e8f0',
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
