/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        surface: {
          900: "#050810",
          800: "#0a0f1e",
          700: "#0e1627",
          600: "#141f38",
          500: "#1a2744",
        },
        ucblue: "#003DA5",
        ucgold: "#FDB71A",
      },
      fontFamily: {
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
    },
  },
  plugins: [],
};
