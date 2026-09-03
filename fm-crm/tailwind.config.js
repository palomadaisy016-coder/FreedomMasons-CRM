/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#111214",
        muted: "#6b7075",
        line: "#e2e4e0",
        paper: "#f7f7f8",
        accent: "#1479e8",
        danger: "#c0392b",
        success: "#3a8a4a",
      },
    },
  },
  plugins: [],
};
