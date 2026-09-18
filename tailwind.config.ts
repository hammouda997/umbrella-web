import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "var(--color-brand)",
          soft: "var(--color-brand-soft)",
          deep: "var(--color-brand-deep)",
        },
        cream: {
          DEFAULT: "var(--color-border)",
          soft: "var(--color-surface-2)",
          sand: "var(--color-cream-sand)",
        },
        ink: {
          DEFAULT: "rgb(var(--ink-rgb) / <alpha-value>)",
          muted: "rgb(var(--ink-muted-rgb) / <alpha-value>)",
        },
        gold: "var(--color-gold)",
        surface: "var(--color-surface)",
        page: "var(--color-page)",
        panel: "var(--panel)",
      },
      boxShadow: {
        soft: "var(--shadow-soft)",
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
