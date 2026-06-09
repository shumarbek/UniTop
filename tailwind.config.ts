import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#18212f",
        mist: "#f4f7fb",
        brand: "#139f8f",
        coral: "#ef5b62",
        amber: "#f5a524"
      },
      boxShadow: {
        soft: "0 18px 60px rgba(24, 33, 47, 0.12)"
      }
    }
  },
  plugins: []
};

export default config;
