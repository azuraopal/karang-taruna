import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'
import { apiApp } from './server/apiApp.js'

function apiPlugin(): Plugin {
  return {
    name: 'katar-api-middleware',
    configureServer(server) {
      server.middlewares.use(apiApp);
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), apiPlugin()],
  server: {
    port: 5379,
    strictPort: true,
    host: true,
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/') || id.includes('node_modules/scheduler/')) {
            return 'react-vendor';
          }
          if (id.includes('node_modules/framer-motion/')) {
            return 'motion-vendor';
          }
          if (id.includes('node_modules/three/')) {
            return 'three-vendor';
          }
        },
      },
    },
  },
})
