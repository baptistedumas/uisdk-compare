import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Served on GitHub Pages at /uisdk-compare/with-uisdk/.
// https://vite.dev/config/shared-options.html#base
export default defineConfig({
  base: '/uisdk-compare/with-uisdk/',
  plugins: [react()],
})
