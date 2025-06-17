// postcss.config.mjs - Исправленная конфигурация для Tailwind CSS 4.x + Next.js 15.3.3

/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    // Tailwind CSS 4.x с новым синтаксисом
    '@tailwindcss/postcss': {},
    // Autoprefixer для кроссбраузерной совместимости
    autoprefixer: {},
  },
}

export default config