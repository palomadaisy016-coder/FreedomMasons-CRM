/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1c2024",
        muted: "#6b7075",
        line: "#e2e4e0",
        paper: "#f7f7f5",
        accent: "#2b4a6f",
        danger: "#b54a2c",
        success: "#4a7a4a",
      },
    },
  },
  plugins: [],
};
