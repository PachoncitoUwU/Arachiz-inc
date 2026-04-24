/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Colores principales de Arachiz
        blue:   { 
          DEFAULT: '#4285F4', 
          50: '#EBF2FF', 
          100: '#D6E4FF', 
          200: '#ADC9FF',
          300: '#84AEFF',
          400: '#5B93FF',
          500: '#4285F4',
          600: '#2563EB',
          700: '#1D4ED8',
          800: '#1E40AF',
          900: '#1E3A8A',
        },
        green:  { 
          DEFAULT: '#34A853', 
          50: '#EDFAF3', 
          100: '#D1F5E0',
          200: '#A3EBC1',
          300: '#75E1A2',
          400: '#47D783',
          500: '#34A853',
          600: '#16A34A',
          700: '#15803D',
          800: '#166534',
          900: '#14532D',
        },
        red:    { 
          DEFAULT: '#EA4335', 
          50: '#FEF2F1', 
          100: '#FEE2E0',
          200: '#FDC5C1',
          300: '#FCA8A2',
          400: '#FB8B83',
          500: '#EA4335',
          600: '#DC2626',
          700: '#B91C1C',
          800: '#991B1B',
          900: '#7F1D1D',
        },
        yellow: { 
          DEFAULT: '#FBBC05', 
          50: '#FFFBEB', 
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#FBBF24',
          500: '#FBBC05',
          600: '#D97706',
          700: '#B45309',
          800: '#92400E',
          900: '#78350F',
        },
        // Colores adicionales para UI
        gray: {
          50: '#F9FAFB',
          100: '#F3F4F6',
          200: '#E5E7EB',
          300: '#D1D5DB',
          400: '#9CA3AF',
          500: '#6B7280',
          600: '#4B5563',
          700: '#374151',
          800: '#1F2937',
          900: '#111827',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 2px 16px -2px rgba(0,0,0,0.07)',
        card: '0 4px 24px -4px rgba(0,0,0,0.08)',
        'card-hover': '0 8px 32px -4px rgba(0,0,0,0.12)',
        glow: '0 0 20px rgba(66, 133, 244, 0.3)',
        'glow-green': '0 0 20px rgba(52, 168, 83, 0.3)',
        'glow-red': '0 0 20px rgba(234, 67, 53, 0.3)',
        'glow-yellow': '0 0 20px rgba(251, 188, 5, 0.3)',
        inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
      },
      borderRadius: {
        xl: '0.875rem',
        '2xl': '1.25rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      animation: {
        // Animaciones de entrada
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'fade-in-up': 'fadeInUp 0.4s ease-out',
        'fade-in-down': 'fadeInDown 0.4s ease-out',
        'fade-in-left': 'fadeInLeft 0.4s ease-out',
        'fade-in-right': 'fadeInRight 0.4s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
        'slide-in-up': 'slideInUp 0.4s ease-out',
        'slide-in-down': 'slideInDown 0.4s ease-out',
        
        // Animaciones de atención
        'bounce-soft': 'bounceSoft 0.6s ease-in-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'wiggle': 'wiggle 0.5s ease-in-out',
        'shake': 'shake 0.5s ease-in-out',
        
        // Animaciones de carga
        'spin-slow': 'spin 2s linear infinite',
        'ping-slow': 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
        
        // Animaciones especiales
        'gradient': 'gradient 3s ease infinite',
        'float': 'float 3s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInDown: {
          '0%': { opacity: '0', transform: 'translateY(-20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        fadeInRight: {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        slideInUp: {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        slideInDown: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        bounceSoft: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '25%': { transform: 'rotate(-3deg)' },
          '75%': { transform: 'rotate(3deg)' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-5px)' },
          '20%, 40%, 60%, 80%': { transform: 'translateX(5px)' },
        },
        gradient: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(66, 133, 244, 0.3)' },
          '50%': { boxShadow: '0 0 30px rgba(66, 133, 244, 0.6)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
      transitionDuration: {
        '400': '400ms',
      },
      transitionTimingFunction: {
        'bounce-in': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      },
    },
  },
  plugins: [
    require('tailwindcss-animate'),
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
};
