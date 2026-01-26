/** @type {import('tailwindcss').Config} */
export default {
    content: [
      "./index.html",
      "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
      extend: {
        colors: {
          primary: '#043276',
        },
      },
    },
    plugins: [],
    safelist: [
      'bg-[#00FF00]',
      'bg-primary',
      'text-primary',
      'border-primary',
    ],
  };
  