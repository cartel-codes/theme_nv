import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: 'class',
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        novraux: {
          // Primary Colors - Dark Luxury Palette
          obsidian: '#0a0a0a',      // Primary dark background
          bone: '#e8e4df',          // Primary light text/background
          graphite: '#1a1a1a',      // Secondary dark background
          ash: '#6b6560',           // Muted neutral for secondary text
          
          // Accent Colors
          gold: '#c9a96e',          // Primary accent (Gold Dust)
          bronze: '#8b7355',        // Secondary accent (Bronze Shadow)
          charcoal: '#2a2a2a',      // Subtle accent (Charcoal Mist)
          
          // Utility Colors
          success: '#5a7a5a',       // Muted green
          warning: '#9a8a6a',       // Warm tan
          error: '#8a5a5a',         // Muted burgundy
          
          // Legacy colors (keeping for compatibility)
          cream: '#FAF8F5',
          beige: '#E8E3DC',
          grey: '#55524F',
          terracotta: '#C97D60',
          navy: '#1A3A52',
        },
      },
      fontFamily: {
        serif: ["var(--font-cormorant)", "Cormorant Garamond", "Georgia", "serif"],
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
      },
      letterSpacing: {
        "novraux-wide": "0.28em",      // For NOVRAUX wordmark
        "novraux-medium": "0.15em",    // For UI labels
        "editorial": "0.2em",
        "editorial-widest": "0.3em",
      },
      animation: {
        fadeIn: 'fadeIn 0.6s ease-out',
        slideUp: 'slideUp 1s ease-out',
        'bounce-slow': 'bounce 2s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(40px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
export default config;
