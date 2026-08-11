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
        // Brand scale anchored on Spanish Viridian (#007F5C) — replaces the old purple identity.
        // Overriding Tailwind's built-in "purple" key means every existing purple-* utility class
        // (text-purple-500, bg-purple-50, border-purple-100, ...) renders green with no template changes.
        purple: {
          50:  "#EAF5F0",
          100: "#D3EAE1",
          200: "#A8D5C4",
          300: "#7DC0A6",
          400: "#3D9E7D",
          500: "#007F5C",
          600: "#00694A",
          700: "#00543D",
          800: "#003D2C",
          900: "#002218",
        },
        brand: {
          50:  "#EAF5F0",
          100: "#D3EAE1",
          200: "#A8D5C4",
          300: "#7DC0A6",
          400: "#4E9A3A",
          500: "#007F5C",
          600: "#00694A",
          700: "#00543D",
          800: "#003D2C",
          900: "#002218",
          950: "#001510",
        },
        dark: "#071711",
      },
    },
  },
  plugins: [],
};
export default config;
