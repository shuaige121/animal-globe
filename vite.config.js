import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
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
