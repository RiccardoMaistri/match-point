module.exports = {
  plugins: [
    require('@tailwindcss/postcss')(), // 👈 nuova sintassi
    require('autoprefixer'),
  ],
};
