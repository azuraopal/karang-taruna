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
})
