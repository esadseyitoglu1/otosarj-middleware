/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // OtoPriz-esinlenmeli marka paleti -- koyu zemin + turkuaz/yesil aksan.
        brand: {
          50: '#eefcf7',
          100: '#d4f7e9',
          200: '#a9efd3',
          300: '#72e0b8',
          400: '#3cc99a',
          500: '#18ab7d',
          600: '#0e8a66',
          700: '#0d6e54',
          800: '#0d5745',
          900: '#0c483a',
          950: '#052920',
        },
        surface: {
          0: '#0b1220',
          50: '#111a2c',
          100: '#182236',
          200: '#212d45',
          300: '#2c3a56',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(60,201,154,0.15), 0 8px 24px -8px rgba(24,171,125,0.35)',
      },
      keyframes: {
        pulseFast: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.55' },
        },
        slideUp: {
          '0%': { transform: 'translateY(12px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        flowDash: {
          to: { strokeDashoffset: '-24' },
        },
      },
      animation: {
        pulseFast: 'pulseFast 1.4s ease-in-out infinite',
        slideUp: 'slideUp 0.25s ease-out',
        flowDash: 'flowDash 1s linear infinite',
      },
    },
  },
  plugins: [],
};
