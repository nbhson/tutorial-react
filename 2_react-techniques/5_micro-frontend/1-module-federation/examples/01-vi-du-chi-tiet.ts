// remote/vite.config.ts — team shop, build bằng Rspack cho production
import { rspack } from '@rspack/core';
import { ModuleFederationPlugin } from '@module-federation/rspack';

export default {
  plugins: [
    new ModuleFederationPlugin({
      name: 'shop',                    // tên scope của remote này
      filename: 'remoteEntry.js',      // bản đồ module, host tải trước
      exposes: { './Cart': './src/Cart.tsx' }, // module công khai ra ngoài
      shared: {                        // các dep dùng chung với host
        react: { singleton: true, requiredVersion: '^19.0.0' },
        'react-dom': { singleton: true, requiredVersion: '^19.0.0' },
      },
    }),
  ],
};
