// vite.config.ts — Vite 8
import { defineConfig } from 'vite';
import react, { reactCompilerPreset } from '@vitejs/plugin-react';
import babel from '@rolldown/plugin-babel';

export default defineConfig({
  plugins: [
    react(), // Fast Refresh qua Oxc, không cần Babel
    babel({ presets: [reactCompilerPreset()] }),
  ],
});
