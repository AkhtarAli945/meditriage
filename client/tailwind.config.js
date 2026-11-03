export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: { teal: { DEFAULT: '#0B6B6A', dark: '#0B5453', soft: '#D8F0EE' }, ink: { DEFAULT: '#0F2A2E', soft: '#17474A' }, line: '#DCE7E5', mut: '#4B6468', page: '#F3F7F6' },
      fontFamily: { sans: ['"DM Sans"', 'system-ui', 'sans-serif'], display: ['Fraunces', 'Georgia', 'serif'], ur: ['"Noto Naskh Arabic"', 'serif'] },
      screens: { xs: '420px', '3xl': '1800px' },
    },
  },
  plugins: [],
};
