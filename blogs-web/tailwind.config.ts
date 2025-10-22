import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        neutral: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
        },
        blue: {
          600: '#2563eb',
          800: '#1e40af',
        },
        gray: {
          200: '#e5e7eb',
          400: '#9ca3af',
          600: '#4b5563',
          800: '#1f2937',
        },
        purple: {
          600: '#6D28D9',
          400: '#A78BFA',
          700: '#5B21B6',
          300: '#C4B5FD',
        },
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
      },
      backgroundImage: {
        'purple-gradient': 'linear-gradient(135deg, #6D28D9 0%, #A78BFA 100%)',
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out',
        'slide-in': 'slideIn 0.6s ease-out',
        'scale-in': 'scaleIn 0.5s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      typography: {
        DEFAULT: {
          css: {
            color: '#374151',
            a: {
              color: '#2563eb',
              textDecoration: 'none',
              '&:hover': { color: '#1d4ed8' },
            },
            h1: { color: '#111827' },
            h2: { color: '#111827' },
            h3: { color: '#111827' },
            code: { color: '#1f2937', backgroundColor: '#f3f4f6', padding: '0.2rem 0.4rem', borderRadius: '0.25rem' },
            blockquote: { borderLeftColor: '#dbeafe' },
            'ul > li::marker': { color: '#9ca3af' },
            'ol > li::marker': { color: '#9ca3af' },
          },
        },
      },
      borderRadius: {
        xl: '0.75rem',
        '2xl': '1rem',
      },
      boxShadow: {
        sm: '0 1px 2px 0 rgba(0,0,0,0.06)',
        DEFAULT: '0 1px 3px 0 rgba(0,0,0,0.1), 0 1px 2px -1px rgba(0,0,0,0.1)',
        lg: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)',
      },
      container: {
        center: true,
        padding: {
          DEFAULT: '1rem',
          sm: '2rem',
          lg: '3rem',
          xl: '4rem',
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
} satisfies Config;