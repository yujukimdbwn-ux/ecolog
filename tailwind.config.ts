import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        eco: {
          deep: '#1B4332',
          mid: '#2D6A4F',
          soft: '#40916C',
          mint: '#B7E4C7',
          pale: '#D8F3DC',
          cream: '#F0FFF4',
        },
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        unlockPop: {
          '0%': { transform: 'scale(0.85)', opacity: '0.5', filter: 'blur(4px)' },
          '55%': { transform: 'scale(1.06)', opacity: '1', filter: 'blur(0)' },
          '100%': { transform: 'scale(1)', opacity: '1', filter: 'blur(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
      },
      animation: {
        unlockPop: 'unlockPop 0.85s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        shimmer: 'shimmer 2.2s linear infinite',
      },
    },
  },
  plugins: [],
};

export default config;
