/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        footprint: '#1E88E5',
        event: '#D32F2F',
        inscription: '#F57F17',
      }
    },
  },
  plugins: [],
}
