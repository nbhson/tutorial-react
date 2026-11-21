// shared-deps.ts — mirror đầy đủ, khớp từng dòng với example.tsx
// Import vào vite/rspack config của CẢ host + remotes — nguồn sự thật duy nhất, tránh lệch
export const sharedDeps = {
  // Một bản React duy nhất toàn hệ thống — 2 bản là Invalid hook call
  react: { singleton: true, requiredVersion: '^19.0.0' },
  'react-dom': { singleton: true, requiredVersion: '^19.0.0' },
  zustand: { singleton: true }, // state dùng chung phải 1 bản — 2 bản là store đôi
} as const;

// Version pinning: production host trỏ URL versioned (chủ động nâng),
// preview trỏ 'latest' để test tích hợp sớm (gãy ở preview, không gãy prod).
export const remoteUrls = {
  production: 'https://cdn.example.com/shop/1.2.0/remoteEntry.js',
  preview: 'https://cdn.example.com/shop/latest/remoteEntry.js',
} as const;
