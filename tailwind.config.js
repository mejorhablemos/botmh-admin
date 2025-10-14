/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // MejorHablemos brand colors
        primary: {
          50: '#f0fdf6',
          100: '#dcfce9',
          200: '#C0EFD4',
          300: '#86efac',
          400: '#4ade80',
          500: '#46876f',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#022C21',
          950: '#052e16',
        },
        secondary: {
          50: '#f7f8f9',
          100: '#eff1f3',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Helvetica', 'Arial', 'sans-serif'],
      },
      borderRadius: {
        'card': '12px',
      },
    },
  },
  plugins: [],
}
