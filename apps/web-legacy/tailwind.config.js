export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'deo-dark': '#1e293b',
        'deo-blue': '#1e3a5f',
        'deo-accent': '#0ea5e9',
        'deo-orange': '#f97316',
      },
      fontFamily: {
        'sans': ['"Inter"', '"Segoe UI"', '"Helvetica Neue"', 'sans-serif'],
      },
      spacing: {
        'sidebar-collapsed': '64px',
        'sidebar-expanded': '240px',
      },
    },
  },
  plugins: [],
}
