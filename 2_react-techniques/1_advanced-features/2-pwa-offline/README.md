# PWA Offline (Vite + React)

> Nguồn: https://vite-pwa-org.netlify.app/ — https://web.dev/learn/pwa/

## Mục tiêu
- Biến app React thành **PWA**: cài được lên màn hình chính, chạy được khi offline.
- Cache chiến lược đúng cho từng loại tài nguyên: shell (JS/CSS/font) cache-first, API network-first.
- Báo trạng thái online/offline cho người dùng + tự động thông báo khi có bản cập nhật.

## Tổng quan
Web app bình thường chết khi mất mạng. PWA dùng **service worker** (SW) — một script chạy ở background thread do trình duyệt quản lý — làm *proxy* giữa app và network: nó đánh chặn request, trả tài nguyên từ cache nếu có, hoặc đi network rồi lưu vào cache. Bài này dùng `vite-plugin-pwa` (bọc Workbox) để sinh SW + manifest tự động, không phải viết SW tay. Áp dụng khi: app cần dùng được ở vùng mạng kém, muốn cài đặt như native app, hoặc muốn tải lại cực nhanh cho user quay lại.

## Khái niệm cốt lõi
- **Vòng đời service worker**: `install` (precache app shell) → `activate` (dọn cache cũ) → `fetch` (đáp ứng mỗi request). SW chỉ nhận quyền điều khiển trang sau lần tải đầu tiên — vì vậy lần mở đầu có thể không thấy hiệu quả cache.
- **Cache strategies (`runtimeCaching`)**: `CacheFirst` (assets tĩnh: JS/CSS/font/ảnh — hiếm đổi), `NetworkFirst` (API — ưu tiên data mới, rơi về cache khi offline), `StaleWhileRevalidate` (vừa trả cache ngay + cân nhắc kiểm tra bản mới nền). Chọn sai strategy là lỗi phổ biến nhất.
- **`registerType: 'autoUpdate'`** → mỗi khi build mới, SW mới tự activate và refresh trang, user không bị kẹt bản cũ. `'prompt'` ngược lại: giữ bản cũ và báo qua sự kiện `onNeedRefresh` để ta làm UI "Cập nhật ngay".
- **`manifest`** (Web App Manifest): JSON mô tả tên, icon, màu — thứ làm nên trải nghiệm "cài đặt" và đủ điều kiện xuất hiện nút cài trên mobile.
- **`useSyncExternalStore`**: đọc `navigator.onLine` (giá trị ngoài React) và đăng ký sự kiện `online`/`offline` để React re-render đúng lúc, kèm dự phòng cho server-render/hydration nếu có.

## Luồng hoạt động / Cách áp dụng
1. Cài `vite-plugin-pwa`; khai báo `manifest` + `workbox.runtimeCaching` trong `vite.config.ts`.
2. Plugin tự sinh `sw.js` + tự `register` SW khi build (mặc định `injectRegister: 'auto'`).
3. Chạy `npm run build && npm run preview`: mở DevTools → Application → Service Workers → tích **Offline**, verify app vẫn chạy.
4. Thêm UI báo trạng thái mạng (hook `useOnline`) và tùy chọn prompt cài đặt (`beforeinstallprompt`) / nút cập nhật (`onNeedRefresh`).
5. Kiểm tra Lighthouse (PWA) và quay lại web để vỗ cache đúng loại (version cache khi đổi schema).

## Ví dụ chi tiết
```ts
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
```

```tsx
// OnlineBadge: báo realtime trạng thái mạng bằng useSyncExternalStore
import { useSyncExternalStore } from 'react';

// subscribe: đăng ký listener; React gọi khi cần "theo dõi" store ngoài
function subscribe(cb: () => void) {
  window.addEventListener('online', cb);   // có mạng lại
  window.addEventListener('offline', cb);  // mất mạng
  return () => {
    // unsubscribe khi component unmount — tránh leak listener
    window.removeEventListener('online', cb);
    window.removeEventListener('offline', cb);
  };
}

export function OnlineBadge() {
  // getSnapshot trả giá trị hiện tại; React so sánh để quyết định re-render
  const online = useSyncExternalStore(subscribe, () => navigator.onLine);
  return (
    <p role="status" style={{ color: online ? 'green' : 'red' }}>
      {online ? 'Đang online' : 'Đang offline — dùng cache'}
    </p>
  );
}
```

## Giải thích từng phần
- `runtimeCaching` với `NetworkFirst` cho API → user mất mạng vẫn thấy data cũ thay vì màn hình lỗi; khi có mạng lại, data tự refresh.
- `useSyncExternalStore(subscribe, getSnapshot)`: hook "cầu nối store ngoài React". `subscribe` đăng ký thay đổi, `getSnapshot` phải **luôn trả cùng chuỗi tham chiếu** khi giá trị không đổi — `navigator.onLine` là boolean nên tự thỏa. Nếu snapshot là object, phải cache/immutable để tránh render vô hạn.
- `role="status"` → màn hình đọc tự mô tả trạng thái (accessibility), không cần focus.
- Shell (JS/CSS/font) được plugin precache tự động ở `install` — đó là lý do app tải lại cực nhanh và mở được khi offline ngay sau lần đầu.

## So sánh (nếu có)
- **CacheFirst vs NetworkFirst vs StaleWhileRevalidate**: CacheFirst — nhanh nhất nhưng data có thể cũ (chỉ cho asset); NetworkFirst — luôn mới, chậm hơn khi mạng yếu (cho API/quan trọng); StaleWhileRevalidate — hiển thị ngay + cập nhật nền (cho tin tức, profile). Không có chiến lược "tốt nhất", chỉ có chiến lược **đúng loại tài nguyên**.
- **`autoUpdate` vs `prompt`**: autoUpdate — ít thao tác, nhưng có thể refresh đột ngột giữa lúc user làm việc; prompt — chủ động hỏi user "Cập nhật ngay/Rất tiếc", kiểm soát timing, nhưng cần thêm code UI.

## Lỗi thường gặp / Chống chỉ định
- **Cache-first cho API** → user thấy data stale mãi, không biết thật giả. Fix: dùng NetworkFirst hoặc StaleWhileRevalidate + hiển thị "data cũ" cho user.
- **Quên cập nhật `cacheVersion`/`precache` khi đổi schema** → app chạy bằng cache cũ sai format. Fix: nâng version cache, hoặc dựa vào autoUpdate + revision do plugin tự quản.
- **Nút cài đặt không hiện** → thường thiếu icon `192x192`/`512x512` hoặc thiếu HTTPS (PWA bắt buộc HTTPS – localhost là ngoại lệ). Fix: thêm icon real, chạy qua HTTPS.
- **Ôm hết mọi strategy trong một `cacheName`** → dọn cache tràn, xóa nhầm dữ liệu app. Fix: tách cache name theo domain/chức năng.
- **Chống chỉ định**: app dữ liệu nhạy luôn phải mới (dashboard realtime, banking) — cache offline làm sai bức tranh; hoặc app không bao giờ dùng lại (trang hạ cánh một lần). Hãy cache có kiểm soát, không cache mọi thứ.

## Câu hỏi thường gặp
- **PWA có chạy trên iOS không?** Có, nhưng iOS hỗ trợ install + service worker từ Safari 11.3+; một số API (background sync) còn hạn chế — test thực tế trên thiết bị.
- **Sửa code mà app vẫn hiện bản cũ?** Service worker đang phục vụ cache cũ. Dùng `registerType: 'autoUpdate'`, bump cache version, hoặc "Update on reload" trong DevTools khi dev.
- **Cache đầy thì sao?** Trình duyệt có quota (thường vài chục–trăm MB); Workbox tự dọn theo `maxEntries`/`maxAgeSeconds`. Cấu hình `expiration` cho từng cache name.
- **Service worker có chạy khi tab đóng?** Có — nó là background context; dùng để đồng bộ, push notification, nhưng chỉ chạy khi trình duyệt cho phép và có sự kiện đánh thức.
- **Làm sao test offline đúng cách?** Chạy `vite preview` (HTTPS hoặc localhost), vào DevTools → Application → Service Workers → tích Offline, rồi reload và kiểm tra tài nguyên.

## Ghi chú 2026
- `vite-plugin-pwa` v1.x dùng Workbox 7; hỗ trợ `injectManifest`/`generateSW` và TypeScript 5.
- Với React 19, dùng `useSyncExternalStore` để đọc `navigator.onLine`/`navigator.connection` viết đúng chuẩn concurrent-safe.
- Cân nhắc Web App Manifest mở rộng (screenshots, shortcuts, display_override) để trải nghiệm cài đặt tốt hơn.

## Best practices / Mẹo
- Dùng `devOptions: { enabled: true }` để test SW ngay ở `vite dev` (tránh bất ngờ trong build).
- Đặt `workbox.navigateFallback` về `index.html` để route SPA mở lại được khi offline.
- Báo cho user qua `navigator.onLine` + `visibilitychange`: khi tab quay lại từ background, mạng có thể đã đổi — re-check toàn bộ.
- Bundle icon + `screenshots` trong manifest để đạt "installable criteria" trên Android/iOS.
- Xem Lighthouse PWA score như "nhiệt kế": tối thiểu 90/100 với app offline-first.

## Bài tập nhỏ
Nâng `2-pwa-offline` thành app "offline notes": dùng NetworkFirst cho API notes, StaleWhileRevalidate cho ảnh, cache-first cho shell. Tích `useOnline` để hiện banner "Bạn đang offline — ghi chú lưu cục bộ". Test: mở app online → tải vài note → bật Offline trong DevTools → xác nhận note vẫn đọc được, sau khi sửa sync lại khi online.

## Reference
- [Vite PWA](https://vite-pwa-org.netlify.app/)
- [Learn PWA (web.dev)](https://web.dev/learn/pwa/)
- [useSyncExternalStore](https://react.dev/reference/react/useSyncExternalStore)