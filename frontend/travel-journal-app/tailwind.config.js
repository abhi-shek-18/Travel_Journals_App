/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    fontFamily:{
      display: ["Poppins", "sans-serif"],
    },
    extend: {
      colors: {
        primary: "#058603",
        secondary: "#EF863E",
      },
      backgroundImage: {
        'login-bg-img': "url('./src/assets/images/bg_img2.jpg')",
        'signup-bg-img': "url('./src/assets/images/bg_img3.jpg')",
      }
    },
  },
  plugins: [],
}

