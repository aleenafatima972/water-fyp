import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    // Listen on the local network too, so a phone on the same WiFi can open http://<laptop-ip>:5173
    host: true,
    // Forward /api requests to the Express backend
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
})
