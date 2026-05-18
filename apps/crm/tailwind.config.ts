import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        ui: ['var(--font-ui)'],
        display: ['var(--font-display)'],
        mono: ['var(--font-mono)'],
      },
      colors: {
        brand: {
          DEFAULT: 'var(--color-primary)',
          dark: 'var(--color-primary-dark)',
          mid: 'var(--color-primary-mid)',
          light: 'var(--color-primary-light)',
        },
        ds: {
          success: 'var(--color-success)',
          'success-light': 'var(--color-success-light)',
          warning: 'var(--color-warning)',
          'warning-light': 'var(--color-warning-light)',
          danger: 'var(--color-danger)',
          'danger-light': 'var(--color-danger-light)',
          info: 'var(--color-info)',
          'info-light': 'var(--color-info-light)',
          'gray-50': 'var(--color-gray-50)',
          'gray-100': 'var(--color-gray-100)',
          'gray-200': 'var(--color-gray-200)',
          'gray-400': 'var(--color-gray-400)',
          'gray-600': 'var(--color-gray-600)',
          'gray-800': 'var(--color-gray-800)',
        },
      },
      borderRadius: {
        xs: 'var(--radius-xs)',
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
      },
    },
  },
  plugins: [],
}

export default config
