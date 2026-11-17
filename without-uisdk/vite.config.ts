import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Served on GitHub Pages at /uisdk-compare/without-uisdk/.
// https://vite.dev/config/shared-options.html#base
export default defineConfig({
  base: '/uisdk-compare/without-uisdk/',
  plugins: [react()],
})