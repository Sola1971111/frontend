import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    origin: 'https://hamburger-crazy-sank.ngrok-free.dev',
    hmr: {
      host: 'hamburger-crazy-sank.ngrok-free.dev',
      protocol: 'wss'
    }
  }
})
