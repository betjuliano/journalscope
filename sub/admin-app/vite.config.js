import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    open: false,
    port: 5175,
    hmr: {
      host: 'localhost',
      protocol: 'ws',
      port: 5175
    }
  },
  define: {
    __SUB_API__: JSON.stringify(process.env.VITE_SUB_API_URL || 'http://localhost:3000')
  }
})