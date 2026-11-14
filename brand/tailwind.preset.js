// Gojoline Tailwind preset. Usage in tailwind.config: presets: [require('./brand/tailwind.preset.js')]
module.exports = {
  theme: {
    extend: {
      colors: {
        clay: { DEFAULT: '#C2410C', hover: '#9A3412', bright: '#F97316', light: '#FDBA74', soft: '#FDE7DA' },
        teal: { DEFAULT: '#0E3B43', mid: '#4F8A91', soft: '#CDE3E5', deep: '#082429' },
        ink: { DEFAULT: '#1C1917', muted: '#57534E' },
        line: '#E7E5E4',
        sand: '#FFF7F0',
      },
      fontFamily: {
        display: ['Outfit', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        ethiopic: ['"Noto Sans Ethiopic"', 'Inter', 'sans-serif'],
      },
    },
  },
};
