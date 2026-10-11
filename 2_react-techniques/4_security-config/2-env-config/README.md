# Env Config (Vite)

> Nguồn: https://vite.dev/guide/env-and-mode.html

## Mục tiêu
- Nắm cách Vite nạp biến môi trường theo `mode` (development/staging/production) và thứ tự ưu tiên file `.env`.
- Chỉ expose biến có prefix `VITE_` ra client; giữ secret ở server.
- Validate env lúc khởi động bằng zod để **fail-fast**, tránh lỗi ngầm "undefined" khi chạy.

## Tổng quan
- Frontend bundle là **công khai** — bất cứ ai cũng mở Dist và đọc được. Vì thế không bao giờ nhúng API key/secret vào bundle frontend.
- Vite chỉ đưa các biến `VITE_*` vào `import.meta.env`; biến khác không có tiền tố bị bỏ qua (trừ khi đổi `envPrefix`).
- Áp dụng cho: URL API, tên app, cờ feature (`VITE_ENABLE_MOCK`), DSN Sentry (ở mức public), version build.
- Secret thật (JWT secret, DB password, third-party key) đặt ở **BFF/proxy/SSR**, không đặt trong `.env` được build ra client.

## Khái niệm cốt lõi
- **Mode ≠ môi trường truyền thống**: Vite chạy `mode` theo lệnh (`dev` mặc định là `development`, `build` là `production`). Bạn có thể đổi: `vite build --mode staging`.
- **Thứ tự nạp `.env`**: `.env` (chung) → `.env.local` → `.env.[mode]` → `.env.[mode].local`. File sau ghi đè file trước. `.local` **không commit**.
- **Thay thế tĩnh lúc build**: Vite thay `import.meta.env.VITE_API_URL` bằng literal tại thời điểm build (giống `define`). Vậy giá trị bị "đóng băng" trong bundle — đổi env phải build lại.
- **`envPrefix`**: mặc định `VITE_`. Có thể set thành `APP_` để tránh trùng, nhưng phải hiểu rõ để không vô tình lộ biến.
- **Secret server-side**: dùng BFF (Backend-for-Frontend) — React gọi `/api`, BFF giữ key và gọi dịch vụ ngoài. Hoặc dùng SSR (Next.js/Remix) đọc `process.env` chỉ trên server.
- **Chỉ mục đích dùng 2 tầng**: biến public (typed + validate) cho client, biến private chỉ tồn tại ở runtime server.

## Luồng hoạt động / Cách áp dụng
1. Tạo `.env` / `.env.development` / `.env.staging` / `.env.production`; thêm `.env*.local` vào `.gitignore`.
2. Tạo `src/config/env.ts` validate bằng zod, đặt `VITE_*` vào schema với kiểu chặt.
3. Khai báo type trong `vite-env.d.ts` (`ImportMetaEnv`) để có autocomplete + type-check.
4. Import `env` (đã validate) thay vì rải `import.meta.env.*` khắp code — một nguồn sự thật duy nhất.
5. Trong `vite.config.ts`, dùng `loadEnv(mode, process.cwd())` nếu cần đọc biến ở tầng config (ví dụ proxy target).
6. Kiểm tra CI: build fail nếu thiếu biến — nhờ zod `.parse()` ném lỗi ngay.

## Ví dụ chi tiết
```ts
// src/config/env.ts — validate env lúc khởi động, thiếu là crash sớm
import { z } from 'zod';

const EnvSchema = z.object({
  // Bắt buộc, phải là URL hợp lệ
  VITE_API_URL: z.string().url(),
  // Có mặc định nếu không khai báo
  VITE_APP_NAME: z.string().default('MyApp'),
  // Chuỗi "true" → boolean
  VITE_ENABLE_MOCK: z
    .string()
    .optional()
    .transform((v) => v === 'true'),
});

// .parse() ném ZodError nếu sai → app dừng ngay thay vì lỗi ngầm undefined
export const env = EnvSchema.parse({
  VITE_API_URL: import.meta.env.VITE_API_URL,
  VITE_APP_NAME: import.meta.env.VITE_APP_NAME,
  VITE_ENABLE_MOCK: import.meta.env.VITE_ENABLE_MOCK,
});

export function AppConfig() {
  return (
    <p>
      {env.VITE_APP_NAME} → {env.VITE_API_URL}
    </p>
  );
}
```

```ts
// vite-env.d.ts — type-safe cho import.meta.env
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_APP_NAME?: string;
  readonly VITE_ENABLE_MOCK?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

```bash
# .env.production (commit được, chỉ chứa giá trị public)
VITE_API_URL=https://api.example.com
VITE_APP_NAME=Shop

# .env.local (KHÔNG commit — override khi phát triển máy cá nhân)
VITE_API_URL=http://localhost:3000
```

```ts
// vite.config.ts — đọc env ở tầng config (không expose ra client)
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), ''); // '' = đọc cả biến không có VITE_
  return {
    plugins: [react()],
    server: {
      // Proxy tránh CORS khi dev; secret target chỉ sống ở config, không vào bundle
      proxy: { '/api': { target: env.API_PROXY_TARGET ?? 'http://localhost:3000', changeOrigin: true } },
    },
  };
});
```

## Giải thích từng phần
- `z.string().url()`: chặn giá trị rỗng hoặc sai định dạng ngay khi khởi động.
- `.transform((v) => v === 'true')`: biến env luôn là string; ép về boolean tường minh.
- `EnvSchema.parse`: fail-fast — cả app không chạy nếu config sai, dễ phát hiện khi deploy.
- `loadEnv(mode, cwd, '')`: tham số thứ ba `''` cho phép đọc **mọi** biến (kể cả không prefix) ở config; các biến này **không** lọt vào bundle.
- `ImportMetaEnv`: TypeScript hiểu kiểu các biến, gõ `import.meta.env.VITE_` sẽ có gợi ý.

## Lỗi thường gặp / Chống chỉ định
- **Nhúng API key bí mật vào `VITE_*`**: bundle public, key lộ ngay → chuyển sang BFF/SSR hoặc server-side env.
- **Tưởng env đổi runtime**: giá trị bị inline lúc build → nhất quán giữa các lần build, không đọc lại khi chạy.
- **Commit `.env.local`**: ghi đè cấu hình người khác, lộ secret cá nhân → thêm `.env*.local` vào `.gitignore`.
- **Đọc `import.meta.env` rải rác**: khó kiểm soát, dễ `undefined` → gom vào `env.ts` đã validate.
- **Nhầm `mode` với `NODE_ENV`**: có thể set `--mode staging` mà `NODE_ENV` vẫn `production` → đặt tên file `.env.staging` và kiểm tra `import.meta.env.MODE`.

## Best practices / Mẹo
- Một nguồn sự thật: chỉ export `env` từ `src/config/env.ts`.
- Dùng zod default + transform để schema tự tài liệu hóa.
- Thêm bước `tsc --noEmit` + build vào CI để bắt cả lỗi type lẫn lỗi env.
- Phân biệt rõ **public config** (được phép lộ) và **secret** (chỉ server).
- Với dự án Next.js/Vite, tham khảo cách t3-env chia `clientEnv`/`serverEnv` để tránh import nhầm.

## Bài tập nhỏ
Thêm biến `VITE_FEATURE_CHAT` (boolean) và `VITE_SENTRY_DSN` (optional URL) vào schema zod; tạo `.env.development` bật chat; viết test đảm bảo thiếu `VITE_API_URL` thì `env.ts` ném lỗi.

## Reference
- [Vite — Env and Mode](https://vite.dev/guide/env-and-mode.html)
- [Vite — loadEnv / Config](https://vite.dev/config/)
- [zod](https://zod.dev/)
- [t3-env](https://env.t3.gg/)
