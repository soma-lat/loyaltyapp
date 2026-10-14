import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f2f7ff",
          100: "#e1ecff",
          500: "#3b6ef6",
          600: "#2f58d6",
          700: "#2645ab",
        },
      },
    },
  },
  plugins: [],
};

export default config;
