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
        novraux: {
          bg: "#0a0a0a",
          "bg-subtle": "#111111",
          text: "#e8e4df",
          "text-dim": "#6b6560",
          accent: "#c9a96e",
          "accent-light": "#d4bc8d",
          "accent-dim": "rgba(201, 169, 110, 0.15)",
          border: "rgba(201, 169, 110, 0.12)",
        },
      },
      fontFamily: {
        serif: ["var(--font-cormorant)", "Cormorant Garamond", "serif"],
        sans: ["var(--font-inter)", "Inter", "sans-serif"],
      },
      letterSpacing: {
        "novraux": "0.3em",
        "novraux-sm": "0.2em",
        "novraux-xs": "0.08em",
      },
    },
  },
  plugins: [],
};
export default config;
