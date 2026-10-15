import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // must be "localhost" (not 127.0.0.1) so the API session cookie is shared
    host: 'localhost',
    port: 5173,
    strictPort: true,
  },
})
