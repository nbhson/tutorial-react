// shared-deps.ts — import vào vite/rspack config của cả host + remotes
export const sharedDeps = {
  react: { singleton: true, requiredVersion: '^19.0.0' },
  'react-dom': { singleton: true, requiredVersion: '^19.0.0' },
  zustand: { singleton: true },
} as const;

// Version pinning: production host trỏ URL versioned,
// preview trỏ 'latest' để test tích hợp sớm.
export const remoteUrls = {
  production: 'https://cdn.example.com/shop/1.2.0/remoteEntry.js',
  preview: 'https://cdn.example.com/shop/latest/remoteEntry.js',
} as const;
