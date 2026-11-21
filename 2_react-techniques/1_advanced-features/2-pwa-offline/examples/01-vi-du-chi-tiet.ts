// vite.config.ts — plugin tự sinh SW + manifest
import { VitePWA } from 'vite-plugin-pwa';

export default {
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',            // tự cập nhật SW khi có build mới
      manifest: {                            // thông tin "cài đặt" của app
        name: 'MyApp',
        short_name: 'MyApp',
        theme_color: '#000000',
      },
      workbox: {
        runtimeCaching: [
          // API: NetworkFirst → luôn lấy mới nếu mạng có, rơi cache khi offline
          {
            urlPattern: /^https:\/\/api\.example\.com\/.*/i,
            handler: 'NetworkFirst',
            options: { cacheName: 'api-cache' },
          },
        ],
      },
    }),
  ],
};
