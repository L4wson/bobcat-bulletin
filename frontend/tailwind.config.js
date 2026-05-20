/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        term: {
          bg:      "#090500",
          card:    "#110800",
          hover:   "#1a0d00",
          border:  "#3a1e00",
          "border-hi": "#7a4500",
          dim:     "#6b3c10",
          base:    "#cc7722",
          bright:  "#ff9900",
          glow:    "#ffcc44",
          muted:   "#4d2800",
        },
      },
      fontFamily: {
        mono: ["Share Tech Mono", "Courier New", "monospace"],
        display: ["VT323", "Share Tech Mono", "monospace"],
      },
      animation: {
        "blink": "blink 1.2s step-end infinite",
        "flicker": "flicker 10s infinite",
        "scanline": "scanline 8s linear infinite",
      },
      keyframes: {
        blink: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0" },
        },
        flicker: {
          "0%,100%": { opacity: "1" },
          "92%": { opacity: "1" },
          "93%": { opacity: "0.96" },
          "94%": { opacity: "1" },
          "96%": { opacity: "0.98" },
          "97%": { opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};
