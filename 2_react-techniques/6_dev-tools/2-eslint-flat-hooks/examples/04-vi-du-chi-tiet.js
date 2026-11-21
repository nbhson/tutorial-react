// eslint.config.js — flat config chuẩn React 19 + TS (ESLint 9/10)
import js from '@eslint/js'; // rules JS cơ bản (no-undef, no-unused...)
import globals from 'globals'; // preset môi trường (browser/node) thay env cũ
import tseslint from 'typescript-eslint'; // rules TS + gộp config flat chuẩn
import reactHooks from 'eslint-plugin-react-hooks'; // v6: hooks + Compiler rules
import reactRefresh from 'eslint-plugin-react-refresh'; // giữ HMR không gãy
import react from 'eslint-plugin-react'; // rules jsx-* (cần thì thêm)

export default tseslint.config(
  { ignores: ['dist', 'coverage'] }, // bỏ qua build/coverage — thay .eslintignore
  js.configs.recommended, // rules JS cơ bản — nền cho mọi file
  ...tseslint.configs.recommended, // rules TS (+ type-aware nếu cấu hình projectService)
  {
    files: ['**/*.{ts,tsx}'], // chỉ áp TS/TSX — test/config khác có thể block riêng
    languageOptions: {
      globals: { ...globals.browser }, // window/document hợp lệ — thay env: { browser: true } cũ (thiếu là no-undef)
      parserOptions: { ecmaFeatures: { jsx: true } }, // parse JSX trong TSX
    },
    plugins: {
      react, // jsx rules — cần settings version dưới
      'react-hooks': reactHooks, // hooks + compiler rules
      'react-refresh': reactRefresh, // HMR guard
    },
    settings: { react: { version: '19' } }, // để rules jsx biết version (sai version là báo sai)
    rules: {
      // v6: rules-of-hooks + exhaustive-deps + Compiler (immutability, purity...) — bật cả, không chỉ exhaustive-deps
      ...reactHooks.configs.flat.recommended.rules,
      'react/react-in-jsx-scope': 'off', // React 17+ không cần import React — tắt để không báo thừa
      'react/jsx-uses-react': 'off', // cùng lý do trên
      // Chặn export lẫn lộn làm gãy HMR (component + helper chung file) — warn để tách file
      'react-refresh/only-export-components': 'warn',
    },
  },
);
