/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#eef1fa",
          100: "#dbe1f4",
          200: "#b7c3e9",
          300: "#8fa2dc",
          400: "#6480cf",
          500: "#3a56b0",
          600: "#324ba0",
          700: "#293e85",
          800: "#21326b",
          900: "#192551",
          950: "#10193a",
        },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px 0 rgba(16, 25, 58, 0.04), 0 1px 6px -1px rgba(16, 25, 58, 0.06)",
        popover: "0 10px 30px -5px rgba(16, 25, 58, 0.18)",
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1.125rem",
      },
      keyframes: {
        fadeIn: { "0%": { opacity: 0 }, "100%": { opacity: 1 } },
        slideIn: { "0%": { transform: "translateX(-100%)" }, "100%": { transform: "translateX(0)" } },
        slideUp: { "0%": { transform: "translateY(8px)", opacity: 0 }, "100%": { transform: "translateY(0)", opacity: 1 } },
      },
      animation: {
        fadeIn: "fadeIn .18s ease-out",
        slideIn: "slideIn .22s ease-out",
        slideUp: "slideUp .18s ease-out",
      },
    },
  },
  plugins: [],
};
