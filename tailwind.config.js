/** @type {import('tailwindcss').Config} */
const token = (name) => `rgb(var(--c-${name}) / <alpha-value>)`;

module.exports = {
  content: ['./views/**/*.ejs', './public/js/**/*.js'],
  theme: {
    // Colores semánticos: los valores cambian con el tema (claro/oscuro) desde src/input.css
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      bg: token('bg'),
      surface: token('surface'),
      raised: token('raised'),
      line: token('line'),
      'line-strong': token('line-strong'),
      ink: token('ink'),
      muted: token('muted'),
      faint: token('faint'),
      accent: token('accent'),
      'on-accent': token('on-accent'),
      ok: token('ok'),
      warn: token('warn'),
      danger: token('danger'),
    },
    fontFamily: {
      sans: ['"Geist Variable"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      mono: ['"Geist Mono Variable"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
    },
    extend: {
      borderRadius: { DEFAULT: '8px', lg: '8px', md: '6px', sm: '4px' },
      transitionTimingFunction: {
        out: 'cubic-bezier(0.23, 1, 0.32, 1)',
        'in-out': 'cubic-bezier(0.77, 0, 0.175, 1)',
      },
    },
  },
  plugins: [],
};
