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
          cream: "#FAF8F5",
          charcoal: "#2B2B2B",
          grey: "#8B8680",
          beige: "#E8E3DC",
          terracotta: "#C97D60",
          navy: "#1A3A52",
        },
      },
      fontFamily: {
        serif: ["var(--font-cormorant)", "Cormorant Garamond", "serif"],
        sans: ["var(--font-jost)", "Jost", "sans-serif"],
      },
      letterSpacing: {
        "editorial": "0.2em",
        "editorial-widest": "0.3em",
      },
    },
  },
  plugins: [],
};
export default config;
