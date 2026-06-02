import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        surface:  'rgb(var(--surface) / <alpha-value>)',
        panel:    'rgb(var(--panel) / <alpha-value>)',
        border:   'rgb(var(--border) / <alpha-value>)',
        content:  'rgb(var(--content) / <alpha-value>)',
        muted:    'rgb(var(--muted) / <alpha-value>)',
        accent:   '#00b8d4',
        success:  '#00a844',
        warning:  '#e6930a',
        danger:   '#ef4444',
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
};

export default config;
