import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/EEG-seizure-detection-website/',
  plugins: [react()],
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 750,
    rollupOptions: {
      output: {
        manualChunks: { charts: ['echarts', 'echarts-for-react'] },
      },
    },
  },
})
