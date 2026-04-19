import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import os from 'os';

// Obtener IP local automáticamente para desarrollo en red local
function getLocalIP() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) return net.address;
    }
  }
  return 'localhost';
}

export default defineConfig({
  build: {
    minify: 'esbuild', // Usar esbuild para minificación (más rápido que terser)
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Arachiz',
        short_name: 'Arachiz',
        description: 'Sistema de gestión de asistencia y gamificación',
        theme_color: '#4285F4',
        icons: [
          {
            src: '/ArachizLogoPNG.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/ArachizLogoPNG.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  server: {
    host: true,      // escucha en 0.0.0.0 — accesible desde celular en la misma WiFi
    port: 5173,
  },
})
