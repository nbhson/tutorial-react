// vite.config.ts — Vite
react({ babel: { plugins: [['babel-plugin-react-compiler', { target: '19' }]] } });

// next.config.ts — Next.js 16 top-level (Next 15: experimental.reactCompiler)
const nextConfig = { reactCompiler: true };
