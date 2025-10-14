/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#FF6B35',
          50: '#FFF4F0',
          100: '#FFE8E0',
          200: '#FFD1C1',
          300: '#FFBAA2',
          400: '#FFA383',
          500: '#FF6B35',
          600: '#FF4500',
          700: '#CC3700',
          800: '#992900',
          900: '#661B00',
        },
        secondary: {
          DEFAULT: '#4ECDC4',
          50: '#F0FFFE',
          100: '#E0FFFD',
          200: '#C1FFFB',
          300: '#A2FFF9',
          400: '#83FFF7',
          500: '#4ECDC4',
          600: '#00B5AA',
          700: '#008C85',
          800: '#006360',
          900: '#003A3B',
        },
        dark: {
          DEFAULT: '#0A1128',
          50: '#334155',
          100: '#1E293B',
          200: '#0F172A',
          300: '#0A1128',
          400: '#081226',
          500: '#060D1B',
          600: '#040810',
          700: '#020305',
          800: '#000000',
          900: '#000000',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Poppins', 'Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'float': 'float 3s ease-in-out infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-slow': 'bounce 2s infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
