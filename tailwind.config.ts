// tailwind.config.ts - Минимальная конфигурация для Tailwind CSS 4.x
import type { Config } from 'tailwindcss'

const config: Config = {
  // Файлы для сканирования Tailwind классов
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  
  // Dark mode через класс (остается как есть)
  darkMode: "class",
  
  // В Tailwind CSS 4.x основная конфигурация переносится в CSS (@theme директива)
  // Оставляем только минимальную конфигурацию здесь
  theme: {
    extend: {
      // Шрифты (Geist Sans из вашего проекта)
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'Arial', 'Helvetica', 'sans-serif'],
      },
    },
  },
  
  // В Tailwind CSS 4.x анимации встроены, внешние плагины не нужны
  plugins: [],
} satisfies Config

export default config