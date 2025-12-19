import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  server: {
    host: true
  },
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate', // Автоматическое обновление кэша
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'Таблица Умножения',
        short_name: 'Умножение',
        description: 'Учим таблицу умножения играючи',
        theme_color: '#ffffff',
        background_color: '#f4f6f8',
        display: 'standalone', // Убирает интерфейс браузера
        orientation: 'portrait', // Фиксируем вертикальную ориентацию
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
})
