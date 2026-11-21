# PWA Offline (Vite + React)

> Nguồn: https://vite-pwa-org.netlify.app/ — https://web.dev/learn/pwa/

## Mục tiêu

Mục này nói về những gì bài giúp bạn đạt được: app chạy được cả khi mất mạng, như khi bạn lưu sẵn đồ ăn trong tủ lạnh để không cần ra cửa hàng.

- Biến app React thành **PWA**: cài được lên màn hình chính, chạy được khi offline.
- Cache chiến lược đúng cho từng loại tài nguyên: shell (JS/CSS/font) cache-first, API network-first.
- Báo trạng thái online/offline cho người dùng + tự động thông báo khi có bản cập nhật.

> **Tóm gọn 1 câu:** PWA biến web app thành "app có tủ lạnh" — dự trữ tài nguyên sẵn để mất mạng vẫn chạy.

## Tổng quan

Mục này nói về nguyên lý hoạt động: vì sao web app bình thường "chết" khi mất mạng, và service worker làm gì để cứu tình hình.

Web app bình thường chết khi mất mạng. PWA dùng **service worker** (SW) — một script chạy ở background thread do trình duyệt quản lý — làm *proxy* giữa app và network: nó đánh chặn request, trả tài nguyên từ cache nếu có, hoặc đi network rồi lưu vào cache. Hãy hình dung SW như một thủ quỹ đứng giữa bạn và kho hàng: bạn xin gì, nó xem kho còn không — còn thì đưa ngay từ kho (cache), hết thì mới chạy ra chợ (network) mua rồi dự trữ thêm vào kho. Bài này dùng `vite-plugin-pwa` (bọc Workbox) để sinh SW + manifest tự động, không phải viết SW tay. Áp dụng khi: app cần dùng được ở vùng mạng kém, muốn cài đặt như native app, hoặc muốn tải lại cực nhanh cho user quay lại.

> **Tóm gọn 1 câu:** Service worker là "thủ quỹ kho cache" đứng giữa app và mạng — có hàng trong kho thì trả ngay, hết mới đi network.

## Khái niệm cốt lõi

Mục này nói về 5 khái niệm bạn cần nắm trước khi làm: vòng đời của service worker, chiến lược cache, chế độ cập nhật, manifest, và cách React đọc trạng thái mạng.

- **Vòng đời service worker**: `install` (precache app shell) → `activate` (dọn cache cũ) → `fetch` (đáp ứng mỗi request). Giống như nhân viên mới vào việc: ngày đầu dọn kho (install), ngày sau giao ca (activate), rồi mới bắt đầu phục vụ khách (fetch). SW chỉ nhận quyền điều khiển trang sau lần tải đầu tiên — vì vậy lần mở đầu có thể không thấy hiệu quả cache.
- **Cache strategies (`runtimeCaching`)**: `CacheFirst` (assets tĩnh: JS/CSS/font/ảnh — hiếm đổi), `NetworkFirst` (API — ưu tiên data mới, rơi về cache khi offline), `StaleWhileRevalidate` (vừa trả cache ngay + âm thầm kiểm tra bản mới nền). Ví von: CacheFirst như dùng tiền mặt trong ví (nhanh, nhưng có thể cũ), NetworkFirst như rút ATM mỗi lần tiêu (luôn mới, nhưng phụ thuộc máy ATM), StaleWhileRevalidate như đưa món ăn cho khách rồi mới đi hỏi bếp xem còn món mới hơn không. Chọn sai strategy là lỗi phổ biến nhất.
- **`registerType: 'autoUpdate'`** → mỗi khi build mới, SW mới tự activate và refresh trang, user không bị kẹt bản cũ — như cửa hàng tự thay biển hiệu mỗi đêm không cần hỏi khách. `'prompt'` ngược lại: giữ bản cũ và báo qua sự kiện `onNeedRefresh` để ta làm UI "Cập nhật ngay".
- **`manifest`** (Web App Manifest): JSON mô tả tên, icon, màu — thứ làm nên trải nghiệm "cài đặt" và đủ điều kiện xuất hiện nút cài trên mobile. Hãy tưởng tượng đó là "giấy khai sinh" của app: không có giấy này, hệ điều hành không biết app trông ra sao để đặt lên màn hình chính.
- **`useSyncExternalStore`**: đọc `navigator.onLine` (giá trị ngoài React) và đăng ký sự kiện `online`/`offline` để React re-render đúng lúc, kèm dự phòng cho server-render/hydration nếu có.

> **Tóm gọn 1 câu:** Nắm 5 thứ: SW đi qua install → activate → fetch, chọn đúng chiến lược cache cho từng loại tài nguyên, chọn autoUpdate/prompt, có manifest để cài được, và dùng `useSyncExternalStore` để React biết đang online hay offline.

## Luồng hoạt động / Cách áp dụng

Mục này nói về 5 bước để biến app thường thành PWA — làm theo tuần tự từ cài đặt đến kiểm chứng.

1. Cài `vite-plugin-pwa`; khai báo `manifest` + `workbox.runtimeCaching` trong `vite.config.ts`.
2. Plugin tự sinh `sw.js` + tự `register` SW khi build (mặc định `injectRegister: 'auto'`).
3. Chạy `npm run build && npm run preview`: mở DevTools → Application → Service Workers → tích **Offline**, verify app vẫn chạy.
4. Thêm UI báo trạng thái mạng (hook `useOnline`) và tùy chọn prompt cài đặt (`beforeinstallprompt`) / nút cập nhật (`onNeedRefresh`).
5. Kiểm tra Lighthouse (PWA) và quay lại web để vỗ cache đúng loại (version cache khi đổi schema).

> **Tóm gọn 1 câu:** Cài plugin → khai cấu hình → build rồi thử "rút điện" (Offline trong DevTools) → thêm UI báo mạng → đo Lighthouse.

## Ví dụ chi tiết

Mục này nói về code hoàn chỉnh của bài — đọc song song với phần giải thích bên dưới để hiểu từng mảnh ghép.

> 📄 **Code ví dụ:** [`examples/01-vi-du-chi-tiet.ts`](examples/01-vi-du-chi-tiet.ts)

> 📄 **Code ví dụ:** [`examples/02-vi-du-chi-tiet.tsx`](examples/02-vi-du-chi-tiet.tsx)

## Giải thích từng phần

Mục này nói về ý nghĩa từng cấu hình trong ví dụ trên — như đọc bản chỉ dẫn sử dụng sau khi lắp ráp.

- `runtimeCaching` với `NetworkFirst` cho API → user mất mạng vẫn thấy data cũ thay vì màn hình lỗi; khi có mạng lại, data tự refresh. Giống như báo giấy: hết báo mới thì đọc báo cũ vẫn hơn không đọc gì.
- `useSyncExternalStore(subscribe, getSnapshot)`: hook "cầu nối store ngoài React". `subscribe` đăng ký thay đổi, `getSnapshot` phải **luôn trả cùng chuỗi tham chiếu** khi giá trị không đổi — `navigator.onLine` là boolean nên tự thỏa. Nếu snapshot là object, phải cache/immutable để tránh render vô hạn. Ví von: hook này như người gác điện thoại — khi có sự kiện (mất mạng), nó bấm chuông cho React biết mà không cần React tự đi hỏi liên tục.
- `role="status"` → màn hình đọc tự mô tả trạng thái (accessibility), không cần focus.
- Shell (JS/CSS/font) được plugin precache tự động ở `install` — đó là lý do app tải lại cực nhanh và mở được khi offline ngay sau lần đầu. Hãy hình dung shell như khung nhà dựng sẵn: mất mạng chỉ là không có đồ nội thất mới, chứ khung vẫn đứng vững.

> **Tóm gọn 1 câu:** Mỗi cấu hình một vai: NetworkFirst giữ API "đọc được báo cũ", `useSyncExternalStore` bấm chuông báo React, shell precache là khung nhà giúp app mở được khi offline.

## So sánh (nếu có)

Mục này nói về việc chọn giữa các chiến lược cache và chế độ cập nhật — đọc để biết khi nào dùng cái nào thay vì dùng mù.

- **CacheFirst vs NetworkFirst vs StaleWhileRevalidate**: CacheFirst — nhanh nhất nhưng data có thể cũ (chỉ cho asset); NetworkFirst — luôn mới, chậm hơn khi mạng yếu (cho API/quan trọng); StaleWhileRevalidate — hiển thị ngay + cập nhật nền (cho tin tức, profile). Không có chiến lược "tốt nhất", chỉ có chiến lược **đúng loại tài nguyên** — giống chọn phương tiện di chuyển: xe máy nhanh cho đường nhỏ, tàu điện ổn định cho đường dài, không có phương tiện nào hợp mọi tuyến.
- **`autoUpdate` vs `prompt`**: autoUpdate — ít thao tác, nhưng có thể refresh đột ngột giữa lúc user làm việc; prompt — chủ động hỏi user "Cập nhật ngay/Rất tiếc", kiểm soát timing, nhưng cần thêm code UI.

> **Tóm gọn 1 câu:** Chọn cache theo "độ hay cũ của tài nguyên", chọn cập nhật theo mức kiểm soát bạn muốn có với user.

## Lỗi thường gặp / Chống chỉ định

Mục này nói về những bẫy phổ biến khiến PWA chạy sai — đọc để tránh mất công debug những lỗi khó hiểu.

- **Cache-first cho API** → user thấy data stale mãi, không biết thật giả. Fix: dùng NetworkFirst hoặc StaleWhileRevalidate + hiển thị "data cũ" cho user.
- **Quên cập nhật `cacheVersion`/`precache` khi đổi schema** → app chạy bằng cache cũ sai format. Ví von như tiệm bán hàng quên xoá giá cũ trên kệ: khách vẫn mua theo giá đã lỗi thời. Fix: nâng version cache, hoặc dựa vào autoUpdate + revision do plugin tự quản.
- **Nút cài đặt không hiện** → thường thiếu icon `192x192`/`512x512` hoặc thiếu HTTPS (PWA bắt buộc HTTPS – localhost là ngoại lệ). Fix: thêm icon real, chạy qua HTTPS.
- **Ôm hết mọi strategy trong một `cacheName`** → dọn cache tràn, xóa nhầm dữ liệu app. Fix: tách cache name theo domain/chức năng.
- **Chống chỉ định**: app dữ liệu nhạy luôn phải mới (dashboard realtime, banking) — cache offline làm sai bức tranh; hoặc app không bao giờ dùng lại (trang hạ cánh một lần). Hãy cache có kiểm soát, không cache mọi thứ.

> **Tóm gọn 1 câu:** Sai lầm chết người là "cache sai thứ": để API đi cache-first là user đọc data cũ mãi, và nhớ PWA bắt buộc HTTPS.

## Câu hỏi thường gặp

Mục này nói về những thắc mắc người mới hay gặp khi làm PWA — tra nhanh khi vướng.

- **PWA có chạy trên iOS không?** Có, nhưng iOS hỗ trợ install + service worker từ Safari 11.3+; một số API (background sync) còn hạn chế — test thực tế trên thiết bị.
- **Sửa code mà app vẫn hiện bản cũ?** Service worker đang phục vụ cache cũ — như nhân viên cửa hàng vẫn đang bán hàng theo bảng giá đã bị gỡ. Dùng `registerType: 'autoUpdate'`, bump cache version, hoặc "Update on reload" trong DevTools khi dev.
- **Cache đầy thì sao?** Trình duyệt có quota (thường vài chục–trăm MB); Workbox tự dọn theo `maxEntries`/`maxAgeSeconds`. Cấu hình `expiration` cho từng cache name.
- **Service worker có chạy khi tab đóng?** Có — nó là background context; dùng để đồng bộ, push notification, nhưng chỉ chạy khi trình duyệt cho phép và có sự kiện đánh thức.
- **Làm sao test offline đúng cách?** Chạy `vite preview` (HTTPS hoặc localhost), vào DevTools → Application → Service Workers → tích Offline, rồi reload và kiểm tra tài nguyên.

## Ghi chú 2026

Mục này nói về những cập nhật mới nhất của hệ sinh thái — đọc để không dùng API cũ từ các tutorial năm trước.

- `vite-plugin-pwa` v1.x dùng Workbox 7; hỗ trợ `injectManifest`/`generateSW` và TypeScript 5.
- Với React 19, dùng `useSyncExternalStore` để đọc `navigator.onLine`/`navigator.connection` viết đúng chuẩn concurrent-safe.
- Cân nhắc Web App Manifest mở rộng (screenshots, shortcuts, display_override) để trải nghiệm cài đặt tốt hơn.

## Best practices / Mẹo

Mục này nói về những thói quen giúp PWA của bạn "sống khỏe" lâu dài — nhỏ nhưng đáng làm từ đầu.

- Dùng `devOptions: { enabled: true }` để test SW ngay ở `vite dev` (tránh bất ngờ trong build).
- Đặt `workbox.navigateFallback` về `index.html` để route SPA mở lại được khi offline.
- Báo cho user qua `navigator.onLine` + `visibilitychange`: khi tab quay lại từ background, mạng có thể đã đổi — re-check toàn bộ.
- Bundle icon + `screenshots` trong manifest để đạt "installable criteria" trên Android/iOS.
- Xem Lighthouse PWA score như "nhiệt kế": tối thiểu 90/100 với app offline-first.

## Bài tập nhỏ

Mục này nói về bài thực hành để bạn tự tay làm một lần — đọc xong làm thử, nhớ lâu gấp nhiều lần chỉ đọc.

Nâng `2-pwa-offline` thành app "offline notes": dùng NetworkFirst cho API notes, StaleWhileRevalidate cho ảnh, cache-first cho shell. Tích `useOnline` để hiện banner "Bạn đang offline — ghi chú lưu cục bộ". Test: mở app online → tải vài note → bật Offline trong DevTools → xác nhận note vẫn đọc được, sau khi sửa sync lại khi online.

> **Tóm gọn 1 câu:** Dựng app "offline notes" để tự kiểm chứng cả ba chiến lược cache hoạt động đúng vai.

## Reference

- [Vite PWA](https://vite-pwa-org.netlify.app/)
- [Learn PWA (web.dev)](https://web.dev/learn/pwa/)
- [useSyncExternalStore](https://react.dev/reference/react/useSyncExternalStore)
