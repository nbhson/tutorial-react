// eslint.config.js
import reactHooks from 'eslint-plugin-react-hooks';
import { defineConfig } from 'eslint/config';
// Preset bật toàn bộ compiler-powered rules
export default defineConfig([reactHooks.configs.flat['recommended-latest']]);
