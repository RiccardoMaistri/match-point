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
          DEFAULT: '#359EFF',
          hover: '#2563eb',
        },
        'primary-text': '#1e293b',
        'secondary-text': '#64748b',
        'background-light': '#f5f7f8',
        'background-dark': '#0f1923',
        'surface-light': '#ffffff',
        'surface-dark': '#1e293b',
        'border-light': '#e2e8f0',
        'border-dark': '#334155',
        background: '#f8fafc',
        'card-background': '#ffffff',
        'card-light': '#ffffff',
        'card-dark': '#1e293b',
        accent: '#e2e8f0',
      },
      fontFamily: {
        sans: ['Inter', 'Manrope', 'Noto Sans', 'sans-serif'],
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/container-queries'),
  ],
}
