import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: 'localhost',
    proxy: {
      '/api': {
        target: 'http://localhost:3002',
        changeOrigin: true
      },
      '/auth': {
        target: 'http://localhost:3002',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/auth/, '/api/auth')
      }
    }
  },
  preview: {
    port: 4173,
    host: '0.0.0.0'
  },
  resolve: {
    alias: {
      '@app': resolve(__dirname, './Module/app'),
      '@main': resolve(__dirname, './Module/Main'),
      '@door': resolve(__dirname, './Module/door')
    }
  }
})
