import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  // 关键：这里必须和你的仓库名一致
  base: '/life-imprint-vue3/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    proxy: {
      // 将 /upload 路径代理到后端服务器
      '/upload': {
        target: 'http://localhost:8080',
        changeOrigin: true
      },
      // 将 /api 路径代理到后端服务器
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true
      }
    }
  }
})
