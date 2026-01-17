/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // === FONTS ===
      fontFamily: {
        display: ['Cormorant Garamond', 'Georgia', 'Times New Roman', 'serif'],
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Consolas', 'monospace'],
      },

      // === FONT SIZES (responsive display sizes) ===
      fontSize: {
        // Display sizes with responsive scaling
        'display-lg': ['2.5rem', { lineHeight: '1.2', fontWeight: '600' }],
        'display-md': ['2rem', { lineHeight: '1.25', fontWeight: '600' }],
        'display-sm': ['1.5rem', { lineHeight: '1.3', fontWeight: '500' }],
        // Responsive text sizes
        'responsive-xs': ['0.75rem', { lineHeight: '1.4' }],
        'responsive-sm': ['0.875rem', { lineHeight: '1.5' }],
        'responsive-base': ['1rem', { lineHeight: '1.5' }],
        'responsive-lg': ['1.125rem', { lineHeight: '1.5' }],
        'responsive-xl': ['1.25rem', { lineHeight: '1.4' }],
        'responsive-2xl': ['1.5rem', { lineHeight: '1.3' }],
      },

      // === SCREENS (explicit breakpoints) ===
      screens: {
        'xs': '475px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
        // Touch-specific breakpoints
        'touch': { 'raw': '(hover: none)' },
        'hover': { 'raw': '(hover: hover)' },
      },

      // === COLORS (with CSS variables support) ===
      colors: {
        // Backgrounds (CSS variables)
        'bg-base': 'rgb(var(--bg-base) / <alpha-value>)',
        'bg-elevated': 'rgb(var(--bg-elevated) / <alpha-value>)',
        'bg-surface': 'rgb(var(--bg-surface) / <alpha-value>)',
        'bg-surface-hover': 'rgb(var(--bg-surface-hover) / <alpha-value>)',
        'bg-overlay': 'rgb(var(--bg-overlay) / <alpha-value>)',

        // Text (CSS variables)
        'text-primary': 'rgb(var(--text-primary) / <alpha-value>)',
        'text-secondary': 'rgb(var(--text-secondary) / <alpha-value>)',
        'text-muted': 'rgb(var(--text-muted) / <alpha-value>)',
        'text-placeholder': 'rgb(var(--text-placeholder) / <alpha-value>)',

        // Borders (CSS variables)
        'border-subtle': 'rgb(var(--border-subtle))',
        'border-default': 'rgb(var(--border-default))',
        'border-strong': 'rgb(var(--border-strong))',

        // Gold palette (CSS variables)
        'gold-50': 'rgb(var(--gold-50) / <alpha-value>)',
        'gold-100': 'rgb(var(--gold-100) / <alpha-value>)',
        'gold-200': 'rgb(var(--gold-200) / <alpha-value>)',
        'gold-300': 'rgb(var(--gold-300) / <alpha-value>)',
        'gold-400': 'rgb(var(--gold-400) / <alpha-value>)',
        'gold-500': 'rgb(var(--gold-500) / <alpha-value>)',
        'gold-600': 'rgb(var(--gold-600) / <alpha-value>)',

        // Semantic colors (CSS variables)
        success: 'rgb(var(--success) / <alpha-value>)',
        warning: 'rgb(var(--warning) / <alpha-value>)',
        error: 'rgb(var(--error) / <alpha-value>)',
        info: 'rgb(var(--info) / <alpha-value>)',

        // Legacy support (Ð´Ð»Ñ Ð¿Ð»Ð°Ð²Ð½Ð¾Ð¹ Ð¼Ð¸Ð³Ñ€Ð°Ñ†Ð¸Ð¸)
        primary: {
          DEFAULT: '#0F1419',
          50: '#F7F8F9',
          100: '#E8EBED',
          200: '#C5CCD2',
          300: '#9BA6B0',
          400: '#6B7A87',
          500: '#445261',
          600: '#2D3A47',
          700: '#1E2832',
          800: '#141C24',
          900: '#0F1419',
        },
        gold: {
          DEFAULT: '#D4A574',
          50: '#FDF8F3',
          100: '#F9EDE0',
          200: '#F2D9BC',
          300: '#E8C297',
          400: '#D4A574',
          500: '#C4884D',
          600: '#A6693A',
          700: '#7D4E2C',
          800: '#54341E',
          900: '#2B1B10',
        },
        surface: {
          DEFAULT: '#1A2332',
          50: '#243044',
          100: '#1F2937',
          200: '#1A2332',
          300: '#374151',
          400: '#4B5563',
          500: '#6B7280',
        },
        background: {
          DEFAULT: '#0F1419',
          dark: '#080B0E',
          elevated: '#1A2332',
        },
        text: {
          primary: '#F1F5F9',
          secondary: '#94A3B8',
          muted: '#64748B',
          inverse: '#0F1419',
          gold: '#D4A574',
        },
      },

      // === SPACING ===
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },

      // === BORDER RADIUS ===
      borderRadius: {
        '4xl': '2rem',
      },

      // === BOX SHADOW ===
      boxShadow: {
        'gold': '0 4px 14px 0 rgba(212, 165, 116, 0.25)',
        'gold-lg': '0 10px 40px -10px rgba(212, 165, 116, 0.35)',
        'inner-gold': 'inset 0 2px 4px 0 rgba(212, 165, 116, 0.1)',
        'dark-lg': '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        'dark-xl': '0 35px 60px -15px rgba(0, 0, 0, 0.6)',
        'card': '0 1px 3px rgba(15, 20, 25, 0.04), 0 1px 2px rgba(15, 20, 25, 0.06)',
        'card-hover': '0 10px 40px -10px rgba(15, 20, 25, 0.12), 0 4px 6px -4px rgba(15, 20, 25, 0.04)',
      },

      // === BACKDROP BLUR ===
      backdropBlur: {
        xs: '2px',
      },

      // === ANIMATIONS ===
      animation: {
        'fade-in': 'fade-in 0.2s ease-out',
        'fade-in-up': 'fade-in-up 0.3s ease-out',
        'fade-in-down': 'fade-in-down 0.3s ease-out',
        'scale-in': 'scale-in 0.2s ease-out',
        'slide-in-right': 'slide-in-right 0.3s ease-out',
        'slide-in-left': 'slide-in-left 0.3s ease-out',
        'spin-slow': 'spin 3s linear infinite',
        'pulse-gold': 'pulse-gold 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },

      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in-down': {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'slide-in-right': {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'slide-in-left': {
          '0%': { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'pulse-gold': {
          '0%, 100%': { 
            boxShadow: '0 0 0 0 rgba(212, 165, 116, 0.4)',
          },
          '50%': { 
            boxShadow: '0 0 0 8px rgba(212, 165, 116, 0)',
          },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },

      // === TRANSITION ===
      transitionDuration: {
        '250': '250ms',
        '350': '350ms',
      },

      // === Z-INDEX ===
      zIndex: {
        '60': '60',
        '70': '70',
        '80': '80',
        '90': '90',
        '100': '100',
      },

      // === BACKGROUND IMAGES ===
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-gold': 'linear-gradient(135deg, #D4A574 0%, #E8C297 50%, #D4A574 100%)',
        'gradient-dark': 'linear-gradient(180deg, #1E2832 0%, #0F1419 100%)',
      },
    },
  },
  plugins: [
    // Plugin Ð´Ð»Ñ scrollbar
    function({ addUtilities }) {
      addUtilities({
        '.scrollbar-hide': {
          '-ms-overflow-style': 'none',
          'scrollbar-width': 'none',
          '&::-webkit-scrollbar': {
            display: 'none',
          },
        },
        '.scrollbar-thin': {
          'scrollbar-width': 'thin',
          '&::-webkit-scrollbar': {
            width: '8px',
            height: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '9999px',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: 'rgba(255, 255, 255, 0.2)',
          },
        },
        '.text-balance': {
          'text-wrap': 'balance',
        },
      });
    },
  ],
};
