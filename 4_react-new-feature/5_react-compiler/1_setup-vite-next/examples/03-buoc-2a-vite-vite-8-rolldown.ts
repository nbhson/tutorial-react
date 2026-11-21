// vite.config.ts — Vite 8 + @vitejs/plugin-react v6+
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react({ compiler: true }), // hoặc react({ compiler: { compilationMode: 'annotation' } })
  ],
});
