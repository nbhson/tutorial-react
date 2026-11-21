// Vite-only variant (dev nhanh) — đổi plugin đúng dòng
import federation from '@module-federation/vite';
export default {
  plugins: [
    federation({
      name: 'shop',
      filename: 'remoteEntry.js',
      exposes: { './Cart': './src/Cart.tsx' },
      shared: { react: { singleton: true }, 'react-dom': { singleton: true } },
    }),
  ],
};
