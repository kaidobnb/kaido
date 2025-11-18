import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('Proxy error:', err);
          });
          // Add more detailed logging
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log(`Proxying request: ${req.method} ${req.url} -> ${proxyReq.path}`);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log(`Proxy response: ${req.method} ${req.url} -> ${proxyRes.statusCode}`);
          });
        },
      },
    },
  },
  preview: {
    port: 5174,
    host: true,
    allowedHosts: ['localhost', '127.0.0.1', 'solymarket.ai', 'www.solymarket.ai', '*.solymarket.ai'],
  },
  define: {
    // Make environment variables available to the client
    'import.meta.env.VITE_API_URL': JSON.stringify(process.env.VITE_API_URL || '/api'),
    // Add debug flag for development
    'import.meta.env.VITE_DEBUG': JSON.stringify(true),
  },
});
