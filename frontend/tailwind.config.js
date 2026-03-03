/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        blue: {
          50: '#fdf3f0',
          100: '#fbe4df',
          200: '#f5c6bc',
          300: '#efa08f',
          400: '#ea6d58',
          500: '#e63919',  // Primary Brand Color Kaïs
          600: '#cb2b11',
          700: '#a9210c',
          800: '#8c1f0e',
          900: '#751d10',
          950: '#400b06',
        },
        slate: {
          50: '#fafafa',
          100: '#f5f5f5',
          200: '#e5e5e5',
          300: '#d4d4d4',
          400: '#a3a3a3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
          950: '#0a0a0a',
        }
      },
      animation: {
        'pulse-slow': 'pulse 10s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'scan': 'scan 8s linear infinite',
        'blink': 'blink 4s infinite',
      },
      keyframes: {
        scan: {
          '0%': { transform: 'translateY(-100vh)', opacity: '0' },
          '50%': { opacity: '1' },
          '100%': { transform: 'translateY(100vh)', opacity: '0' },
        },
        blink: {
          '0%, 96%, 100%': { transform: 'scaleY(1)' },
          '98%': { transform: 'scaleY(0.1)' }
        }
      }
    },
  },
  plugins: [],
};