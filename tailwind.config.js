/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'luxury-black': '#0A0A0A',
        'rose-gold': '#B76E79',
        'champagne': '#F7E7CE',
        'soft-white': '#FAFAFA',
      },
      fontFamily: {
        'garamond': ['"Cormorant Garamond"', 'serif'],
        'inter': ['Inter', 'sans-serif'],
      },
      animation: {
        'shimmer': 'shimmer 2.5s ease-out forwards',
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        shimmer: {
          '0%': { transform: 'translateX(-100%) skewX(-20deg)', opacity: '0' },
          '20%': { opacity: '0.8' },
          '100%': { transform: 'translateX(200%) skewX(-20deg)', opacity: '0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0) translateX(0)', opacity: '0.2' },
          '50%': { transform: 'translateY(-20px) translateX(10px)', opacity: '0.5' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(183, 110, 121, 0.2)' },
          '100%': { boxShadow: '0 0 20px rgba(183, 110, 121, 0.6)' },
        }
      },
    },
  },
  plugins: [],
}
