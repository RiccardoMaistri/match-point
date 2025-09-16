/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#6D28D9',
        secondary: '#9CA3AF',
        background: '#F9FAFB',
        foreground: '#1F2937',
        accent: '#10B981',
        muted: '#6B7280',
        dark: {
          primary: '#8B5CF6',
          secondary: '#6B7280',
          background: '#1F2937',
          foreground: '#F9FAFB',
          accent: '#10B981',
          muted: '#9CA3AF',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
