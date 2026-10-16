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
        // Tokens del portal del cliente (diseño pagina-inicio-usuario)
        primary: "#111827",
        accent: "#2563EB",
        surface: "#F9FAFB",
        bordercolor: "#E5E7EB",
        muted: "#6B7280",
      },
      fontFamily: {
        // La variable --font-nunito la define el layout del portal con next/font
        nunito: ["var(--font-nunito)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      keyframes: {
        fadeIn: {
          from: { opacity: "0", transform: "translateY(4px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        fadeIn: "fadeIn 200ms ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
