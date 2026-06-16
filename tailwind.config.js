/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js}'],
  theme: {
    extend: {
      colors: {
        bg: '#0d0d1a',
        sidebar: '#111127',
        card: '#1a1a30',
        accent: '#7c9ef8',
        success: '#4ade80',
        danger: '#f87171',
        border: '#1e1e3a',
      },
    },
  },
  plugins: [],
}
