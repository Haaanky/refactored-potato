import { defineConfig } from 'astro/config'
import svelte from '@astrojs/svelte'
import tailwindcss from '@tailwindcss/vite'

// ASTRO_BASE is injected by CI for PR previews:
//   production  → /refactored-potato/
//   PR preview  → /refactored-potato/pr-preview/pr-<N>/
const base = process.env.ASTRO_BASE ?? '/refactored-potato/'

export default defineConfig({
  integrations: [svelte()],
  output: 'static',
  base,
  vite: {
    plugins: [tailwindcss()],
  },
})
