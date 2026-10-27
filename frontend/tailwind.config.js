/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        gov: {
          navy: '#0A3871',
          navyHover: '#082C59',
          saffron: '#EA580C',
          green: '#15803D',
          bgLight: '#F8FAFC',
          cardLight: '#FFFFFF',
          borderLight: '#E2E8F0',
          textLight: '#0F172A',
          subtextLight: '#475569',
        },
        spotify: {
          base: '#121212',
          panel: '#181818',
          card: '#1F1F1F',
          cardHover: '#2A2A2A',
          subtext: '#B3B3B3',
          green: '#1DB954',
          greenHover: '#1ED760',
          darkBorder: '#282828',
          elevated: '#242424',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
