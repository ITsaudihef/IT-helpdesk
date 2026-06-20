import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  "#f2f9ec",
          100: "#e0f1d0",
          200: "#c3e4a6",
          300: "#9dd274",
          400: "#6fb54a",   // Primary — HEF green
          500: "#58a033",
          600: "#438026",
          700: "#00805b",   // Dark green accent
          800: "#1e5c18",
          900: "#1a4a14",
          950: "#0d2a09",
        },
        dark: "#1a1a1a",
      },
    },
  },
  plugins: [],
};
export default config;
