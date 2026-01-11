import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // path alias resolution for @ imports (used by shadcn/ui)
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
