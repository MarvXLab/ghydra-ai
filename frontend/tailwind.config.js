/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Dark theme surface palette
        surface: {
          900: '#080a0f',
          800: '#0d1017',
          700: '#111520',
          600: '#161b2a',
          500: '#1c2235',
          400: '#232b40',
          300: '#2d3650',
        },
        // Accent — electric blue, no gradients
        accent: {
          DEFAULT: '#3b82f6',
          dim:     '#1d4ed8',
          muted:   '#1e3a5f',
        },
        // Threat severity
        threat: {
          critical: '#ef4444',
          high:     '#f97316',
          medium:   '#eab308',
          low:      '#22c55e',
        },
        // Light theme
        light: {
          bg:      '#f8fafc',
          surface: '#ffffff',
          border:  '#e2e8f0',
          text:    '#0f172a',
          muted:   '#64748b',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: { sm: '4px', DEFAULT: '6px', lg: '8px', xl: '12px' },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
        'blink': 'blink 1.2s step-end infinite',
        'scan': 'scan 2s linear infinite',
      },
      keyframes: {
        blink: { '0%,100%': { opacity: '1' }, '50%': { opacity: '0' } },
        scan:  { '0%': { transform: 'translateY(-100%)' }, '100%': { transform: 'translateY(100vh)' } },
      },
    },
  },
  plugins: [],
}
