import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    allowedHosts: ['.tunnelmole.net'],
    proxy: {
      '/api': { target: 'http://localhost:4000', changeOrigin: true },
      '/documenti': { target: 'http://localhost:4000', changeOrigin: true },
    },
  },
})
