/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: {
          DEFAULT: "#1a1a1f",
          light: "#f8f8fa",
        },
        card: {
          DEFAULT: "#252529",
          light: "#ffffff",
        },
        primary: {
          DEFAULT: "#5b9a8b",
          50: "#e8f4f1",
          100: "#c5e4de",
          200: "#9ed2c8",
          300: "#77c0b2",
          400: "#5b9a8b",
          500: "#4a8a7b",
          600: "#3d7368",
          700: "#315c54",
          800: "#254540",
          900: "#192e2c",
        },
        text: {
          DEFAULT: "#e8e8e8",
          light: "#1a1a1f",
        },
        muted: {
          DEFAULT: "#6b6b70",
          light: "#9ca3af",
        },
        success: "#22c55e",
        warning: "#f59e0b",
        error: "#ef4444",
        info: "#3b82f6",
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
    },
  },
  plugins: [],
};
