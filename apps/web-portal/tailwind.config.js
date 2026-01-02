/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        stc: {
          navy: '#141450',
          'navy-light': '#1E1E6E',
          gold: '#DCA000',
          'gold-light': '#F5C518',
          'bg-dark': '#0A0A2E',
          'bg-light': '#F8F9FA',
        }
      },
      fontFamily: {
        alexandria: ['Alexandria', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
