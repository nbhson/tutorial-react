// ✅ ĐÚNG (flat): mảng, files glob, globals tường minh, ignores chung
export default tseslint.config(
  { ignores: ['dist', 'coverage'] }, // thay .eslintignore
  js.configs.recommended,
  ...tseslint.configs.recommended,
  { files: ['**/*.{ts,tsx}'], languageOptions: { globals: { ...globals.browser } } },
);
