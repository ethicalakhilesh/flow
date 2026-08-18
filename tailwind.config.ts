import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#0F1A1C",
        surface: "#FFFFFF",
        canvas: "#F5F7F6",
        border: "#E4E9E7",
        muted: "#6B7876",
        brand: {
          DEFAULT: "#0E7C6B",
          dark: "#0A5C50",
          light: "#E4F3EF",
        },
        income: "#0E7C6B",
        expense: "#C4573E",
        warn: "#C7902F",
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
      },
      borderRadius: {
        xl2: "1.25rem",
      },
      boxShadow: {
        card: "0 1px 2px rgba(15, 26, 28, 0.04), 0 8px 24px rgba(15, 26, 28, 0.06)",
      },
    },
  },
  plugins: [],
};

export default config;
