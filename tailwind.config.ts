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
          50:  "#f5f0ff",
          100: "#ede0ff",
          200: "#d8b8ff",
          300: "#bf84ff",
          400: "#a855f7",
          500: "#7C3AED",
          600: "#6D28D9",
          700: "#5B21B6",
          800: "#4C1D95",
          900: "#3B0764",
          950: "#2e0657",
        },
        dark: "#080820",
      },
    },
  },
  plugins: [],
};
export default config;
