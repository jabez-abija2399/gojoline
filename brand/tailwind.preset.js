// Gojoline Tailwind preset. Usage in tailwind.config: presets: [require('./brand/tailwind.preset.js')]
// Palette "Paper and Coral" (2026-11). Light values; dark values are in tokens.css.
module.exports = {
  theme: {
    extend: {
      colors: {
        paper: '#FBF9F6',
        sunken: '#F6F2EC',
        line: '#E9E4DC',
        ink: { DEFAULT: '#121212', hover: '#2B2926', muted: '#5F5A53' },
        faint: '#8A847B',
        link: '#C2370F',
        coral: { DEFAULT: '#FF5B35', hover: '#FF7350', soft: '#FFE9E2' },
        'on-coral': '#121212',
        lagoon: '#0E7C66',
        warning: '#A3530A',
        danger: '#C81E3A',
        sun: '#FFD23F',
      },
      fontFamily: {
        display: ['Outfit', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        ethiopic: ['"Noto Sans Ethiopic"', 'Inter', 'sans-serif'],
      },
    },
  },
};
