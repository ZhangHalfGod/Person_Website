/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './Module/**/*.{js,jsx}'
  ],
  theme: {
    extend: {
      colors: {
        corridor: {
          bg: '#07080b',
          warm: '#e8a15a'
        }
      }
    }
  },
  plugins: []
}
