/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        system: {
          cyan: '#00ffcc',      // The main neon glow
          dark: '#0a0a0a',      // Deepest background
          panel: '#111315',     // Slightly lighter for cards
          gray: '#2a2d34',      // Borders and empty bars
          red: '#ff003c',       // HP Bar
          blue: '#0066ff',      // MP Bar
        }
      },
      fontFamily: {
        // Use a tech font from Google Fonts like 'Rajdhani' or 'Orbitron'
        tech: ['Orbitron', 'sans-serif'],
        mono: ['Space Mono', 'monospace'],
      }
    },
  },
  plugins: [],
}