# Test với Vitest + Testing Library

> Nguồn: https://vitest.dev/ — https://testing-library.com/docs/react-testing-library/intro/

## Mục tiêu
- Hiểu vì sao Vitest là lựa chọn tự nhiên cho dự án Vite và API tương thích Jest.
- Viết test component theo **hành vi người dùng** bằng Testing Library + `user-event`.
- Cấu hình jsdom, setup file, mock fetch bằng MSW, và chạy coverage ở CI.

## Tổng quan

Mục này phác thế giới test của dự án Vite trước khi đi chi tiết cấu hình: đọc để biết Vitest + Testing Library đứng ở đâu trong bức tranh kiểm thử.

- Vitest dùng chung pipeline transform của Vite → cấu hình tối thiểu, khởi động nhanh, HMR cho test. Ví von: Vitest dùng chung bếp với Vite — không phải dựng bếp lò riêng nên bật lửa là nấu được ngay.
- Testing Library khuyến khích test "như người dùng": tìm bằng role/label, click bằng `userEvent` — không test implementation (state nội bộ, props trung gian).
- Áp dụng cho: unit test helper/hook, component test (jsdom), integration test với MSW, coverage.
- Không phù hợp để đo hiệu năng thật hay E2E đầy đủ — cái đó để Playwright/Cypress.

> **Tóm gọn 1 câu:** Vitest + Testing Library = test như người dùng: tìm theo role, bấm bằng `userEvent`, API thật được MSW chặn — không test ruột gan component.

## Khái niệm cốt lõi

Mục này giải nghĩa từng mảnh trong bộ test: môi trường jsdom, `globals`, setup file, `getByRole`, `user-event`, MSW và `renderHook`. Đọc để hiểu "ai lo chuyện gì" trong một file test.

- **Môi trường**: `environment: 'jsdom'` giả DOM; `happy-dom` nhanh hơn nhưng khác biệt nhỏ; `node` cho test thuần.
- **`globals: true`**: dùng `describe/it/expect` không import; hoặc import tường minh từ `vitest`.
- **`setupFiles`**: chạy trước mỗi test file — nạp `@testing-library/jest-dom` (matcher `toBeInTheDocument`...), mock `matchMedia`, cleanup.
- **`getByRole`**: query theo ARIA role — sát nhất với cách user/screen reader thấy; kèm `{ name: ... }` lọc theo accessible name.
- **`user-event` (v14+)**: mô phỏng sát thực (`click`, `type`, `keyboard`, `tab`), khác `fireEvent` (chỉ bắn sự kiện nguyên bản).
- **MSW (Mock Service Worker)**: chặn `fetch`/XHR ở network layer — test render khi API chậm/lỗi mà không cần giả React. Ví von: MSW như diễn viên đóng thế — đứng ở "cửa" thay API thật trả lời, để bạn tập đủ mọi kịch bản chậm/lỗi mà không đụng server thật.
- **`renderHook`**: render custom hook trong context riêng.

## Luồng hoạt động / Cách áp dụng

Mục này là 6 bước dựng hệ test từ cài gói tới coverage ở CI — đi hết là có một bộ test chạy được ngay.

1. Cài: `vitest`, `jsdom`, `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom`, `msw`.
2. `vitest.config.ts`: `environment: 'jsdom'`, `globals: true`, `setupFiles`.
3. Tạo `src/test/setup.ts`: import jest-dom, cleanup tự động `afterEach`.
4. Viết test: render → act như user → assert bằng role + matcher.
5. Mock API bằng MSW trong `src/test/server.ts`.
6. CI: `vitest run --coverage` với provider `@vitest/coverage-v8`.

> **Tóm gọn 1 câu:** jsdom giả DOM, `userEvent` giả tay người dùng, MSW giả API — ba "diễn viên đóng thế" cho phép test hành vi thật mà không cần server thật.

## Ví dụ chi tiết
> 📄 **Code ví dụ:** [`examples/01-vi-du-chi-tiet.tsx`](examples/01-vi-du-chi-tiet.tsx)

> 📄 **Code ví dụ:** [`examples/02-vi-du-chi-tiet.tsx`](examples/02-vi-du-chi-tiet.tsx)

> 📄 **Code ví dụ:** [`examples/03-vi-du-chi-tiet.ts`](examples/03-vi-du-chi-tiet.ts)

> 📄 **Code ví dụ:** [`examples/04-vi-du-chi-tiet.ts`](examples/04-vi-du-chi-tiet.ts)

> 📄 **Code ví dụ:** [`examples/05-vi-du-chi-tiet.ts`](examples/05-vi-du-chi-tiet.ts)

## Giải thích từng phần
- `userEvent.setup()`: khởi tạo user với các tùy chọn; luôn `await` các action.
- `screen.getByRole('button', { name: '+' })`: tìm button bằng accessible name — thay đổi cách render (icon, text) không phá test miễn name giữ.
- `toBeInTheDocument()`: matcher từ jest-dom, kiểm tra node có trong document.
- `afterEach(cleanup)`: Testing Library auto-cleanup với jest-dom/vitest — giữ để rõ ràng.
- MSW handler: thay thế fetch layer, giúp test loading/error không cần mock component.

## Lỗi thường gặp / Chống chỉ định

Mục này là 5 cách viết test "hình thức chạy được nhưng hại dài hạn" — nhất là test implementation. Đọc để giữ bộ test bền khi refactor.

- **Test implementation** (gọi hàm nội bộ, đọc state) → dễ vỡ khi refactor → chỉ test hành vi observable.
- **Dùng `fireEvent` thay vì `userEvent`**: miss các bước user thật (focus, keyup) → dùng `user-event` cho interaction.
- **Quên `environment: 'jsdom'`**: `document` undefined → test chạy ở node → set environment đúng.
- **Réf chờ `waitFor` khi không cần**: test chậm/flaky → ghép `findBy*` thay vì `waitFor + getBy`.
- **MSW chặn sai URL**: test ngầm gọi API thật → khớp đúng path và `server.resetHandlers()` mỗi test.

> **Tóm gọn 1 câu:** Test hành vi người dùng chứ không test ruột gan — `getByRole` + `userEvent` bền, còn test implementation vỡ ngay khi refactor.

## Best practices / Mẹo
- Sử dụng `screen` thay vì destructure từ `render` (tự khỏi bị lỗi "not wrapped in act").
- Match theo role/name/label, tránh query theo class/test-id khi có thể.
- Gom handler MSW theo domain, tái dùng nhiều test.
- Đặt ngưỡng coverage hợp lý (không 100% mù quáng); ưu tiên test luồng quan trọng.
- Chạy `vitest run` ở CI, `vitest` (watch) khi dev.

> **Tóm gọn 1 câu:** Query theo role/name, dùng `screen`, coverage có ngưỡng hợp lý — bộ test là lưới an toàn cho việc refactor, đừng biến nó thành gánh nặng chỉnh sửa mỗi lần đổi UI.

## Bài tập nhỏ
Viết test cho `CounterView`: kiểm tra nút `-` (thêm vào component) giảm giá trị nhưng không dưới 0, và test `EmailField` từ nhóm 8 hiển thị `role="alert"` khi có error. Chạy coverage và nêu 3 đoạn chưa phủ.

## Reference
- [Vitest](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [user-event](https://testing-library.com/docs/user-event/intro/)
- [MSW](https://mswjs.io/)