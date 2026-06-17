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
        memorial: {
          cream: '#faf6ef',
          'cream-dark': '#f5efe3',
          surface: '#fffef9',
          gold: '#d4bc8a',
          'gold-dark': '#c9a86c',
          border: '#e8dcc8',
          navy: '#1e3a5f',
          ink: '#3d3429',
          muted: '#8a7b6a',
        },
      },
      fontFamily: {
        memorial: ['"Noto Serif SC"', '"Songti SC"', '"STSong"', 'serif'],
      },
      boxShadow: {
        memorial: '0 4px 24px rgba(30, 58, 95, 0.08)',
        'memorial-lg': '0 8px 32px rgba(30, 58, 95, 0.12)',
      },
    },
  },
  plugins: [],
}
