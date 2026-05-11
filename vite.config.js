import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
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
