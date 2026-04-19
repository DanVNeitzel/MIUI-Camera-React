import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/MIUI-Camera-React/',
  plugins: [react()],
  server: {
    host: true,
  },
});
