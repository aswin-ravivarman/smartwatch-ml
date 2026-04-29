/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Syne"', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'monospace'],
        body:    ['"DM Sans"', 'sans-serif'],
      },
      colors: {
        bg:     '#080c14',
        panel:  '#0d1424',
        border: '#1a2540',
        accent: '#00e5ff',
        green:  '#00ff88',
        amber:  '#ffb020',
        red:    '#ff3d5a',
        purple: '#9b6dff',
        muted:  '#3a4a6b',
        text:   '#c8d8f0',
      },
      boxShadow: {
        glow:         '0 0 20px rgba(0,229,255,0.25)',
        'glow-green': '0 0 20px rgba(0,255,136,0.25)',
        'glow-red':   '0 0 20px rgba(255,61,90,0.35)',
        'glow-amber': '0 0 20px rgba(255,176,32,0.25)',
      },
    },
  },
  plugins: [],
}
