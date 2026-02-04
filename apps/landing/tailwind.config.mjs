/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        coral: {
          50: '#FFF4F2',
          100: '#FFE4DF',
          200: '#FFC7BF',
          300: '#FFA08F',
          400: '#FF7A60',
          500: '#FF6045',
          600: '#E54D34',
          700: '#BF3825',
          800: '#9C2F20',
          900: '#822B1F',
        },
        blue: {
          10: "#E4EDFD",
          50: '#EEF4FE',
          100: '#D8E6FD',
          200: '#B0CDFB',
          300: '#6FA3F5',
          400: '#3C7FEF',
          500: '#085FE9',
          600: '#064DBD',
          700: '#053B91',
          800: '#042E72',
          900: '#03245B',
        },
        sky: {
          50: '#F0F7FF',
          100: '#E0F0FF',
          200: '#C7E4FF',
        }
      },
    },
  },
  plugins: [],
};
