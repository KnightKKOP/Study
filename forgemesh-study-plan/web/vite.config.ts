import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { planData } from './vite-plugin-plan.ts'
import { PLAN_SOURCE } from './plan.config.ts'

export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss(), planData(fileURLToPath(new URL('..', import.meta.url)), PLAN_SOURCE)],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    host: '127.0.0.1',
    port: 47321,
    strictPort: true,
  },
})
