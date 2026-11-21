# Env Config (Vite)

> Nguồn: https://vite.dev/guide/env-and-mode.html

## Mục tiêu
- Nắm cách Vite nạp biến môi trường theo `mode` (development/staging/production) và thứ tự ưu tiên file `.env`.
- Chỉ expose biến có prefix `VITE_` ra client; giữ secret ở server.
- Validate env lúc khởi động bằng zod để **fail-fast**, tránh lỗi ngầm "undefined" khi chạy.

## Tổng quan

Mục này phác bức tranh lớn trước khi đi chi tiết: vì sao bundle frontend là "công khai" và điều đó quy định gì cho cách bạn giữ biến cấu hình.

- Frontend bundle là **công khai** — bất cứ ai cũng mở Dist và đọc được. Ví von: bundle như tờ rơi phát miễn phí — thứ gì in lên đó thì coi như công bố cả thế giới. Vì thế không bao giờ nhúng API key/secret vào bundle frontend.
- Vite chỉ đưa các biến `VITE_*` vào `import.meta.env`; biến khác không có tiền tố bị bỏ qua (trừ khi đổi `envPrefix`).
- Áp dụng cho: URL API, tên app, cờ feature (`VITE_ENABLE_MOCK`), DSN Sentry (ở mức public), version build.
- Secret thật (JWT secret, DB password, third-party key) đặt ở **BFF/proxy/SSR**, không đặt trong `.env` được build ra client.

> **Tóm gọn 1 câu:** Mọi thứ vào bundle là công khai — chỉ `VITE_*` public config được lên client, secret thì ở hẳn server/BFF.

## Khái niệm cốt lõi

Mục này giải nghĩa 6 khái niệm tạo nên mô hình env của Vite: `mode` là gì, file `.env` nạp theo thứ tự nào, giá trị bị "đóng băng" ở đâu, và secret trú ẩn ở đâu. Đọc để hiểu vì sao env frontend "đóng băng lúc build".

- **Mode ≠ môi trường truyền thống**: Vite chạy `mode` theo lệnh (`dev` mặc định là `development`, `build` là `production`). Bạn có thể đổi: `vite build --mode staging`.
- **Thứ tự nạp `.env`**: `.env` (chung) → `.env.local` → `.env.[mode]` → `.env.[mode].local`. File sau ghi đè file trước. `.local` **không commit**.
- **Thay thế tĩnh lúc build**: Vite thay `import.meta.env.VITE_API_URL` bằng literal tại thời điểm build (giống `define`). Vậy giá trị bị "đóng băng" trong bundle — đổi env phải build lại. Ví von: giá trị được "in sẵn" lên từng tờ rơi lúc in ấn — muốn đổi nội dung thì phải in lại lô mới, không viết tay chỉnh được tờ đã phát.
- **`envPrefix`**: mặc định `VITE_`. Có thể set thành `APP_` để tránh trùng, nhưng phải hiểu rõ để không vô tình lộ biến.
- **Secret server-side**: dùng BFF (Backend-for-Frontend) — React gọi `/api`, BFF giữ key và gọi dịch vụ ngoài. Hoặc dùng SSR (Next.js/Remix) đọc `process.env` chỉ trên server.
- **Chỉ mục đích dùng 2 tầng**: biến public (typed + validate) cho client, biến private chỉ tồn tại ở runtime server.

## Luồng hoạt động / Cách áp dụng

Mục này là 6 bước dựng hệ env chuẩn từ lúc tạo file tới lúc CI chặn build thiếu biến — làm một lần, cả dự án khỏi lo env "undefined" ngầm.

1. Tạo `.env` / `.env.development` / `.env.staging` / `.env.production`; thêm `.env*.local` vào `.gitignore`.
2. Tạo `src/config/env.ts` validate bằng zod, đặt `VITE_*` vào schema với kiểu chặt.
3. Khai báo type trong `vite-env.d.ts` (`ImportMetaEnv`) để có autocomplete + type-check.
4. Import `env` (đã validate) thay vì rải `import.meta.env.*` khắp code — một nguồn sự thật duy nhất.
5. Trong `vite.config.ts`, dùng `loadEnv(mode, process.cwd())` nếu cần đọc biến ở tầng config (ví dụ proxy target).
6. Kiểm tra CI: build fail nếu thiếu biến — nhờ zod `.parse()` ném lỗi ngay.

> **Tóm gọn 1 câu:** Một nguồn sự thật duy nhất: mọi `VITE_*` qua schema zod trong `env.ts`, validate fail-fast lúc khởi động, secret thì không bao giờ lên client.

## Ví dụ chi tiết
> 📄 **Code ví dụ:** [`examples/01-vi-du-chi-tiet.ts`](examples/01-vi-du-chi-tiet.ts)

> 📄 **Code ví dụ:** [`examples/02-vi-du-chi-tiet.ts`](examples/02-vi-du-chi-tiet.ts)

> 📄 **Code ví dụ:** [`examples/03-vi-du-chi-tiet.sh`](examples/03-vi-du-chi-tiet.sh)

> 📄 **Code ví dụ:** [`examples/04-vi-du-chi-tiet.ts`](examples/04-vi-du-chi-tiet.ts)

## Giải thích từng phần
- `z.string().url()`: chặn giá trị rỗng hoặc sai định dạng ngay khi khởi động.
- `.transform((v) => v === 'true')`: biến env luôn là string; ép về boolean tường minh.
- `EnvSchema.parse`: fail-fast — cả app không chạy nếu config sai, dễ phát hiện khi deploy.
- `loadEnv(mode, cwd, '')`: tham số thứ ba `''` cho phép đọc **mọi** biến (kể cả không prefix) ở config; các biến này **không** lọt vào bundle.
- `ImportMetaEnv`: TypeScript hiểu kiểu các biến, gõ `import.meta.env.VITE_` sẽ có gợi ý.

## Lỗi thường gặp / Chống chỉ định

Mục này là 5 lần "vết xe đổ" khi làm env — nhất là cố nhét secret vào `VITE_*`. Đọc để không lặp lại.

- **Nhúng API key bí mật vào `VITE_*`**: bundle public, key lộ ngay → chuyển sang BFF/SSR hoặc server-side env.
- **Tưởng env đổi runtime**: giá trị bị inline lúc build → nhất quán giữa các lần build, không đọc lại khi chạy.
- **Commit `.env.local`**: ghi đè cấu hình người khác, lộ secret cá nhân → thêm `.env*.local` vào `.gitignore`.
- **Đọc `import.meta.env` rải rác**: khó kiểm soát, dễ `undefined` → gom vào `env.ts` đã validate.
- **Nhầm `mode` với `NODE_ENV`**: có thể set `--mode staging` mà `NODE_ENV` vẫn `production` → đặt tên file `.env.staging` và kiểm tra `import.meta.env.MODE`.

> **Tóm gọn 1 câu:** Env frontend "đóng băng lúc build" — không có runtime secret, không commit `.local`, và chỉ đọc env từ một file đã validate.

## Best practices / Mẹo
- Một nguồn sự thật: chỉ export `env` từ `src/config/env.ts`.
- Dùng zod default + transform để schema tự tài liệu hóa.
- Thêm bước `tsc --noEmit` + build vào CI để bắt cả lỗi type lẫn lỗi env.
- Phân biệt rõ **public config** (được phép lộ) và **secret** (chỉ server).
- Với dự án Next.js/Vite, tham khảo cách t3-env chia `clientEnv`/`serverEnv` để tránh import nhầm.

> **Tóm gọn 1 câu:** Quy ước vàng: một nguồn sự thật `env.ts`, schema zod tự tài liệu hóa, và ranh giới "public config vs secret" rõ như ranh giới phòng khách và két sắt.

## Bài tập nhỏ
Thêm biến `VITE_FEATURE_CHAT` (boolean) và `VITE_SENTRY_DSN` (optional URL) vào schema zod; tạo `.env.development` bật chat; viết test đảm bảo thiếu `VITE_API_URL` thì `env.ts` ném lỗi.

## Reference
- [Vite — Env and Mode](https://vite.dev/guide/env-and-mode.html)
- [Vite — loadEnv / Config](https://vite.dev/config/)
- [zod](https://zod.dev/)
- [t3-env](https://env.t3.gg/)
