import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// base: './' — чтобы статика работала и на GitHub Pages из подпапки
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
})
