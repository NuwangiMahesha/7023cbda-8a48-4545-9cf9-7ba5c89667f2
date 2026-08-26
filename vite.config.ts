import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // This ensures all routes are handled by index.html for client-side routing
    historyApiFallback: true,
  },
})
