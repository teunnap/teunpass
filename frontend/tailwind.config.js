/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand-blue': '#0A4AEF',
        'app-bg': '#F4F7FB',
        'sidebar-bg': '#FFFFFF',
      }
    },
  },
  plugins: [],
}
