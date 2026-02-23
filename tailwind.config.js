/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'media',
  theme: {
    extend: {
      colors: {
        'ios-blue': '#007aff',
        'ios-bg': 'var(--ios-bg)',
        'ios-primary': 'var(--text-primary)',
        'ios-secondary': 'var(--text-secondary)',
        'ios-card': 'var(--card-bg)',
        'ios-border': 'var(--border-color)',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      }
    },
  },
  plugins: [],
}
