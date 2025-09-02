/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class', // Enable dark mode with class strategy
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      fontFamily: {
        'stardos-stencil': ['StardosStencil_400Regular'],
      },
    },
  },
  plugins: [],
};
