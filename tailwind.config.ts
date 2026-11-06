import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Paleta tomada del logotipo VNG Store
        cream: { DEFAULT: "#F6ECDF", 50: "#FCF8F2", 100: "#F8F1E7", 200: "#F1E4D2", 300: "#E6D3BA" },
        espresso: { DEFAULT: "#3B2418", 700: "#4E3426", 500: "#7A5D4B", 300: "#A8907F" },
        copper: { DEFAULT: "#D98A45", 600: "#BF7330", 100: "#F6E2CF" },
        ink: "#1C1714",
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      letterSpacing: { widest2: "0.32em" },
      keyframes: {
        "fade-up": { "0%": { opacity: "0", transform: "translateY(14px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
        "fade-in": { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        "slide-in": { "0%": { transform: "translateX(100%)" }, "100%": { transform: "translateX(0)" } },
      },
      animation: {
        "fade-up": "fade-up .8s cubic-bezier(.2,.7,.2,1) both",
        "fade-in": "fade-in .5s ease both",
        "slide-in": "slide-in .35s cubic-bezier(.2,.7,.2,1) both",
      },
    },
  },
  plugins: [],
};

export default config;
