/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'primary': '#FFFFFF',
        'secondary': '#FDF9F7',
        'gold': '#C9A96E',
        'blush': '#E8D5C4',
        'charcoal': '#1A1A1A',
        'grey-medium': '#6B6B6B',
        'grey-light': '#AAAAAA',
        'border-subtle': '#F0EBEB',
        'success-color': '#4CAF50',
        'error-color': '#E53935',
        'pink-touch': '#F8BBD9',
        // Backward compatibility
        'luxury-black': '#1A1A1A',
        'rose-gold': '#C9A96E',
        'champagne': '#E8D5C4',
        'soft-white': '#FFFFFF',
      },
      fontFamily: {
        'garamond': ['"Cormorant Garamond"', 'serif'],
        'inter': ['Inter', 'sans-serif'],
        'lora': ['Lora', 'serif'],
      },
      boxShadow: {
        'luxury': '0 2px 20px rgba(0, 0, 0, 0.06)',
      },
      animation: {
        'shimmer': 'shimmer 2.5s ease-out forwards',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { transform: 'translateX(-100%) skewX(-20deg)', opacity: '0' },
          '20%': { opacity: '0.8' },
          '100%': { transform: 'translateX(200%) skewX(-20deg)', opacity: '0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0) translateX(0)', opacity: '0.1' },
          '50%': { transform: 'translateY(-20px) translateX(10px)', opacity: '0.3' },
        },
      },
    },
  },
  plugins: [],
}
