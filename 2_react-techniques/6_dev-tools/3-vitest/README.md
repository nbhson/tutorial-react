# Test với Vitest + Testing Library

> Nguồn: https://vitest.dev/ — https://testing-library.com/docs/react-testing-library/intro/

## Mục tiêu
- Hiểu vì sao Vitest là lựa chọn tự nhiên cho dự án Vite và API tương thích Jest.
- Viết test component theo **hành vi người dùng** bằng Testing Library + `user-event`.
- Cấu hình jsdom, setup file, mock fetch bằng MSW, và chạy coverage ở CI.

## Tổng quan
- Vitest dùng chung pipeline transform của Vite → cấu hình tối thiểu, khởi động nhanh, HMR cho test.
- Testing Library khuyến khích test "như người dùng": tìm bằng role/label, click bằng `userEvent` — không test implementation (state nội bộ, props trung gian).
- Áp dụng cho: unit test helper/hook, component test (jsdom), integration test với MSW, coverage.
- Không phù hợp để đo hiệu năng thật hay E2E đầy đủ — cái đó để Playwright/Cypress.

## Khái niệm cốt lõi
- **Môi trường**: `environment: 'jsdom'` giả DOM; `happy-dom` nhanh hơn nhưng khác biệt nhỏ; `node` cho test thuần.
- **`globals: true`**: dùng `describe/it/expect` không import; hoặc import tường minh từ `vitest`.
- **`setupFiles`**: chạy trước mỗi test file — nạp `@testing-library/jest-dom` (matcher `toBeInTheDocument`...), mock `matchMedia`, cleanup.
- **`getByRole`**: query theo ARIA role — sát nhất với cách user/screen reader thấy; kèm `{ name: ... }` lọc theo accessible name.
- **`user-event` (v14+)**: mô phỏng sát thực (`click`, `type`, `keyboard`, `tab`), khác `fireEvent` (chỉ bắn sự kiện nguyên bản).
- **MSW (Mock Service Worker)**: chặn `fetch`/XHR ở network layer — test render khi API chậm/lỗi mà không cần giả React.
- **`renderHook`**: render custom hook trong context riêng.

## Luồng hoạt động / Cách áp dụng
1. Cài: `vitest`, `jsdom`, `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom`, `msw`.
2. `vitest.config.ts`: `environment: 'jsdom'`, `globals: true`, `setupFiles`.
3. Tạo `src/test/setup.ts`: import jest-dom, cleanup tự động `afterEach`.
4. Viết test: render → act như user → assert bằng role + matcher.
5. Mock API bằng MSW trong `src/test/server.ts`.
6. CI: `vitest run --coverage` với provider `@vitest/coverage-v8`.

## Ví dụ chi tiết
```tsx
// example.tsx — component mẫu để test
import { useState } from 'react';

export function CounterView() {
  const [count, setCount] = useState(0);
  return (
    <div>
      <p>Giá trị: {count}</p>
      <button onClick={() => setCount((c) => c + 1)}>+</button>
    </div>
  );
}
```

```tsx
// Counter.test.tsx — test theo hành vi người dùng
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { expect, test } from 'vitest';
import { CounterView } from './example';

test('tăng giá trị khi click nút "+"', async () => {
  const user = userEvent.setup();
  render(<CounterView />);

  // Trước: giá trị ban đầu
  expect(screen.getByText('Giá trị: 0')).toBeInTheDocument();

  // Như user thật bấm — trigger click + bỏ qua microtask
  await user.click(screen.getByRole('button', { name: '+' }));

  // Sau: hiển thị 1
  expect(screen.getByText('Giá trị: 1')).toBeInTheDocument();
});
```

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,                            // dùng describe/test/expect không cần import
    setupFiles: './src/test/setup.ts',
    coverage: { provider: 'v8', reporter: ['text', 'html'] },
  },
});
```

```ts
// src/test/setup.ts — chạy trước mọi test
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(() => cleanup()); // dọn DOM sau test, tránh rò rỉ
```

```ts
// src/test/server.ts — MSW, test component có fetch
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

export const handlers = [
  http.get('/api/me', () => HttpResponse.json({ name: 'Son' })),
];
export const server = setupServer(...handlers);
// Trong setup.ts: beforeAll(server.listen) / afterEach(server.resetHandlers) / afterAll(server.close)
```

## Giải thích từng phần
- `userEvent.setup()`: khởi tạo user với các tùy chọn; luôn `await` các action.
- `screen.getByRole('button', { name: '+' })`: tìm button bằng accessible name — thay đổi cách render (icon, text) không phá test miễn name giữ.
- `toBeInTheDocument()`: matcher từ jest-dom, kiểm tra node có trong document.
- `afterEach(cleanup)`: Testing Library auto-cleanup với jest-dom/vitest — giữ để rõ ràng.
- MSW handler: thay thế fetch layer, giúp test loading/error không cần mock component.

## Lỗi thường gặp / Chống chỉ định
- **Test implementation** (gọi hàm nội bộ, đọc state) → dễ vỡ khi refactor → chỉ test hành vi observable.
- **Dùng `fireEvent` thay vì `userEvent`**: miss các bước user thật (focus, keyup) → dùng `user-event` cho interaction.
- **Quên `environment: 'jsdom'`**: `document` undefined → test chạy ở node → set environment đúng.
- **Réf chờ `waitFor` khi không cần**: test chậm/flaky → ghép `findBy*` thay vì `waitFor + getBy`.
- **MSW chặn sai URL**: test ngầm gọi API thật → khớp đúng path và `server.resetHandlers()` mỗi test.

## Best practices / Mẹo
- Sử dụng `screen` thay vì destructure từ `render` (tự khỏi bị lỗi "not wrapped in act").
- Match theo role/name/label, tránh query theo class/test-id khi có thể.
- Gom handler MSW theo domain, tái dùng nhiều test.
- Đặt ngưỡng coverage hợp lý (không 100% mù quáng); ưu tiên test luồng quan trọng.
- Chạy `vitest run` ở CI, `vitest` (watch) khi dev.

## Bài tập nhỏ
Viết test cho `CounterView`: kiểm tra nút `-` (thêm vào component) giảm giá trị nhưng không dưới 0, và test `EmailField` từ nhóm 8 hiển thị `role="alert"` khi có error. Chạy coverage và nêu 3 đoạn chưa phủ.

## Reference
- [Vitest](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [user-event](https://testing-library.com/docs/user-event/intro/)
- [MSW](https://mswjs.io/)