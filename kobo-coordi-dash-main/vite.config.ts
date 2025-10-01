import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  server: {
    host: "::",
    port: 3001, // Changed from 8080 to 3001
    proxy: {
      '/api/kobo': {
        target: 'https://kf.kobotoolbox.org/api/v2',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/kobo/, ''),
        configure: (proxy, _options) => {
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            proxyReq.setHeader(
              'Authorization',
              'Token fc37a9329918014ef595b183adcef745a4beb217'
            );
            proxyReq.setHeader('Accept', 'application/json');
            console.log('Proxying:', req.method, req.url);
          });
        },
      },
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});