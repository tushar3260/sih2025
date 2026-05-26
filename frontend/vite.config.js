import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  build: {
    // Raise warning limit so we don't get noise (we'll fix with splitting)
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        // Manual chunk splitting — separates vendor libs into cacheable chunks
        manualChunks: {
          // React core
          'vendor-react':   ['react', 'react-dom', 'react-router-dom'],
          // Animation library
          'vendor-framer':  ['framer-motion'],
          // HTTP client
          'vendor-axios':   ['axios'],
          // Icons
          'vendor-icons':   ['lucide-react'],
          // Socket.io client
          'vendor-socket':  ['socket.io-client'],
        },
      },
    },
  },

  // Optimize dev server — faster HMR
  optimizeDeps: {
    include: ['react', 'react-dom', 'framer-motion', 'axios', 'lucide-react'],
  },

  server: {
    // Warm up frequently used modules on dev server start
    warmup: {
      clientFiles: [
        './src/App.jsx',
        './src/pages/AyurvedaLanding.jsx',
        './src/pages/PatientDashboard.jsx',
        './src/pages/AyurvedaDoctorDashboard.jsx',
      ],
    },
  },
})
