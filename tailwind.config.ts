import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: '#001f3f',
        'navy-light': '#003366',
        bordeaux: '#990000',
      },
      fontFamily: {
        roboto: ['Roboto', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
