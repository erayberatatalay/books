import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef6ff",
          100: "#d9e9ff",
          200: "#bcd9ff",
          300: "#8ec1ff",
          400: "#599eff",
          500: "#3478f6",
          600: "#1f5ae0",
          700: "#1948b8",
          800: "#1a3e93",
          900: "#1b3774",
        },
      },
    },
  },
  plugins: [],
};

export default config;
