import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#1d4ed8",
        "background-light": "#f6f7f8",
        "background-dark": "#101922",
        "surface-light": "#ffffff",
        "surface-dark": "#0f172a",
      },
      fontFamily: {
        sans: ["var(--font-plus-jakarta)", "system-ui", "sans-serif"],
        heading: ["var(--font-noto-sans)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
