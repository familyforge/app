/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./admin/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Dark Mode (default) - per README.md design system
        background: {
          DEFAULT: "#1a1a1f", // dark charcoal
          light: "#f8f8fa",
        },
        card: {
          DEFAULT: "#252529", // mist gray
          light: "#ffffff",
        },
        primary: {
          DEFAULT: "#5b9a8b", // desaturated blue-green
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
        // Status colors
        success: "#22c55e",
        warning: "#f59e0b",
        error: "#ef4444",
        info: "#3b82f6",
      },
      fontFamily: {
        sans: ["PlusJakartaSans_400Regular", "system-ui", "sans-serif"],
        medium: ["PlusJakartaSans_500Medium", "system-ui", "sans-serif"],
        semibold: ["PlusJakartaSans_600SemiBold", "system-ui", "sans-serif"],
        bold: ["PlusJakartaSans_700Bold", "system-ui", "sans-serif"],
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
    },
  },
  plugins: [],
};
