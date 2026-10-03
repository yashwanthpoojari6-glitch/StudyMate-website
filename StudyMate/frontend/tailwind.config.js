/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // StudyMate design system color tokens
        'bg-primary': '#0B0F17',
        'bg-secondary': '#111827',
        'bg-card': '#151C2C',
        'border-subtle': '#1E293B',
        'accent-indigo': '#6366F1',
        'accent-emerald': '#10B981',
        'accent-amber': '#F59E0B',
        'text-primary': '#F1F5F9',
        'text-secondary': '#94A3B8',
        'text-muted': '#475569',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'shimmer': 'shimmer 2s linear infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(99,102,241,0.3)' },
          '100%': { boxShadow: '0 0 20px rgba(99,102,241,0.8), 0 0 40px rgba(99,102,241,0.3)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      backgroundImage: {
        'shimmer-gradient': 'linear-gradient(90deg, transparent 25%, rgba(255,255,255,0.05) 50%, transparent 75%)',
        'card-gradient': 'linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(16,185,129,0.04) 100%)',
        'hero-gradient': 'radial-gradient(ellipse at top, rgba(99,102,241,0.15) 0%, transparent 70%)',
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'card': '0 0 0 1px rgba(30,41,59,0.8), 0 4px 6px -1px rgba(0,0,0,0.3)',
        'card-hover': '0 0 0 1px rgba(99,102,241,0.3), 0 10px 15px -3px rgba(0,0,0,0.4)',
        'glow-indigo': '0 0 20px rgba(99,102,241,0.4)',
        'glow-emerald': '0 0 20px rgba(16,185,129,0.4)',
        'glow-amber': '0 0 20px rgba(245,158,11,0.4)',
      },
    },
  },
  plugins: [],
}
