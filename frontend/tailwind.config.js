/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        blue:   { DEFAULT: '#4285F4', 50: '#EBF2FF', 100: '#D6E4FF', 600: '#2563EB' },
        green:  { DEFAULT: '#34A853', 50: '#EDFAF3', 100: '#D1F5E0', 600: '#16A34A' },
        red:    { DEFAULT: '#EA4335', 50: '#FEF2F1', 100: '#FEE2E0', 600: '#DC2626' },
        yellow: { DEFAULT: '#FBBC05', 50: '#FFFBEB', 100: '#FEF3C7', 600: '#D97706' },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 2px 16px -2px rgba(0,0,0,0.07)',
        card: '0 4px 24px -4px rgba(0,0,0,0.08)',
      },
      borderRadius: {
        xl: '0.875rem',
        '2xl': '1.25rem',
      },
    },
  },
  plugins: [],
};
