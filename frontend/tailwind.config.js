/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#ecfdf5",
          100: "#d1fae5",
          200: "#a7f3d0",
          300: "#6ee7b7",
          400: "#34d399",
          500: "#10b981",
          600: "#059669",
          700: "#047857",
          800: "#065f46",
          900: "#064e3b",
        },
      },
      backgroundImage: {
        "brand-gradient": "linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%)",
      },
      boxShadow: {
        glass: "0 8px 32px 0 rgba(16, 185, 129, 0.15)",
      },
    },
  },
  plugins: [],
};
