import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/animal-globe/',
  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        manualChunks: {
          'globe': ['globe.gl', 'three'],
          'd3': ['d3'],
          'react-vendor': ['react', 'react-dom', 'framer-motion'],
        }
      }
    }
  },
  optimizeDeps: {
    include: ['globe.gl', 'three', 'd3', 'framer-motion']
  }
})
