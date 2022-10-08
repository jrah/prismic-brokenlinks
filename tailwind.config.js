module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
    theme: {
    extend: {
      colors: {
        'brand-purple': '#525ca6',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
