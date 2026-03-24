import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'yami-navy': '#1B2B4B',
        'yami-navy-light': '#243560',
        'yami-blue': '#2A7CC7',
        'yami-blue-light': '#4A9EE0',
        'yami-sky': '#6BB8E8',
        'yami-bg': '#F0F4F8',
        dark: '#0D1B35',
        navy: '#1A2D5A',
        teal: '#0D7A6B',
        gold: '#D4A017',
        'env-green': '#10B981',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
export default config
