/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        'comic': ['Comic Sans MS', 'Comic Sans', 'cursive'],
        'marker': ['Permanent Marker', 'cursive'],
        'sans': ['Nunito', 'Arial', 'sans-serif'],
        'heading': ['Inter', 'Roboto', 'Arial', 'sans-serif'],
        'inter': ['Inter', 'Roboto', 'Arial', 'sans-serif'],
      },
      colors: {
        'pastel-pink': '#FFD6E0',
        'pastel-blue': '#C7CEEA',
        'pastel-yellow': '#FFECA9',
      },
      animation: {
        'tilt': 'tilt 10s infinite linear',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        tilt: {
          '0%, 50%, 100%': {
            transform: 'rotate(0deg)',
          },
          '25%': {
            transform: 'rotate(0.5deg)',
          },
          '75%': {
            transform: 'rotate(-0.5deg)',
          },
        },
      },
    },
  },
  plugins: [],
};
