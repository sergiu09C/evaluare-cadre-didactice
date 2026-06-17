/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Geist', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        display: ['Geist', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        mono: ['Geist Mono', 'ui-monospace', 'SF Mono', 'JetBrains Mono', 'monospace'],
      },
      colors: {
        // ECD Primary (deep navy academic)
        primary: {
          50: '#EEF3F8',
          100: '#D4DFEC',
          200: '#A6BCD3',
          300: '#7393B5',
          400: '#466E92',
          500: '#2A4F73',
          600: '#1B3A57',
          700: '#143049',
          800: '#0E2233',
          900: '#06121E',
          DEFAULT: '#0E2233',
        },
        // ECD Accent (violet)
        accent: {
          50: '#F5F3FF',
          100: '#EDE9FE',
          200: '#DDD6FE',
          300: '#C4B5FD',
          400: '#A78BFA',
          500: '#8B5CF6',
          600: '#7C3AED',
          700: '#6D28D9',
          800: '#5B21B6',
          900: '#4C1D95',
          DEFAULT: '#7C3AED',
        },
        // ECD Neutrals (cool, blue-tinted)
        neutral: {
          0: '#FFFFFF',
          25: '#FAFAFB',
          50: '#F5F6F8',
          100: '#ECEEF2',
          200: '#D9DDE4',
          300: '#B6BCC8',
          400: '#8A92A3',
          500: '#5F6878',
          600: '#434B5C',
          700: '#2B3243',
          800: '#181D2C',
          900: '#0A0B0E',
        },
        // Semantic
        success: { DEFAULT: '#10B981', bg: '#ECFDF5', fg: '#065F46' },
        warning: { DEFAULT: '#F59E0B', bg: '#FFFBEB', fg: '#92400E' },
        danger:  { DEFAULT: '#EF4444', bg: '#FEF2F2', fg: '#991B1B' },
        info:    { DEFAULT: '#3B82F6', bg: '#EFF6FF', fg: '#1E40AF' },
      },
      borderRadius: {
        sm: '4px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        '2xl': '24px',
      },
      boxShadow: {
        'elev-1': '0 1px 2px rgba(14, 34, 51, 0.04), 0 1px 1px rgba(14, 34, 51, 0.03)',
        'elev-2': '0 1px 3px rgba(14, 34, 51, 0.06), 0 4px 12px rgba(14, 34, 51, 0.05)',
        'elev-3': '0 2px 6px rgba(14, 34, 51, 0.06), 0 12px 28px rgba(14, 34, 51, 0.08)',
        'elev-4': '0 4px 12px rgba(14, 34, 51, 0.08), 0 24px 56px rgba(14, 34, 51, 0.12)',
        'elev-5': '0 8px 28px rgba(14, 34, 51, 0.14), 0 32px 80px rgba(14, 34, 51, 0.18)',
      },
      transitionTimingFunction: {
        'ease-out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      transitionDuration: {
        fast: '150ms',
        med: '200ms',
        slow: '300ms',
      },
      keyframes: {
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.55' },
        },
      },
      animation: {
        'pulse-soft': 'pulse-soft 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
