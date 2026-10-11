# DAY 21: TESTING & E2E

## Mục tiêu bài học
- Nắm bộ đôi chuẩn 2026: **Vitest + React Testing Library (RTL)** cho unit/integration và **Playwright** cho E2E.
- Hiểu triết lý RTL: test theo **hành vi người dùng** (role/label/text), không test chi tiết implementation (state, tên hàm nội bộ).
- Biết phân tầng test (unit/integration/E2E) và viết được test đầu tiên với `user-event`.

## Khái niệm cốt lõi (Core)
- **Angular dùng Karma/Jasmine + TestBed + Protractor/Cypress.** React + Vite 2026: **Vitest** (nhanh, dùng chung config Vite, API vui vẻ) + **RTL** (render component, query theo accessibility) + **Playwright** (E2E đa browser, auto-wait).
- **RTL philosophy:** "The more your tests resemble the way your software is used, the more confidence they can give you." → Query qua `getByRole`, `getByLabelText`, `getByText` — thay vì chọc vào state/props nội bộ.
- **`render(<Comp/>)`** tương đương `TestBed.createComponent`. **`screen`** là cầu truy vấn DOM. **`user-event`** mô phỏng tương tác thật (click, type, tab) — khác `fireEvent` là low-level.
- **`toBeInTheDocument()`** đến từ `@testing-library/jest-dom` — matcher thân thiện cho assertion DOM.
- **Vitest chạy trong jsdom:** DOM giả lập, nhanh (không cần browser). Cấu hình `test.environment: "jsdom"` + `setupFiles`.
- **Playwright E2E:** chạy browser thật (Chromium/Firefox/WebKit), auto-wait khi element chưa sẵn sàng — ổn định hơn sleep thủ công. Test luồng quan trọng (login, checkout).
- **Phân tầng:** Unit = logic thuần (hàm, hook với `renderHook`); Integration = component + user-event; E2E = luồng xuyên nhiều trang + browser thật.
- **Keyword chính:** Vitest, RTL, `render`, `screen`, `getByRole`, `userEvent`, `jest-dom`, `renderHook`, Playwright, `page.getByRole`, auto-wait.

## Luồng hoạt động (Flow)
1. Chạy `npx vitest`: Vitest đọc `vite.config.ts`, khởi tạo environment `jsdom`, nạp `test-setup.ts` (import `@testing-library/jest-dom`).
2. Mỗi file test load component và gọi `render(<App/>)` — React mount vào một container DOM trong jsdom.
3. `await userEvent.click(screen.getByRole("button", { name: "+1" }))`:
   - RTL tìm nút theo role + accessible name;
   - user-event mô phỏng pointer + focus + click thật (không phải chỉ gọi handler).
4. Sự kiện click chạy `setCount(c => c+1)` → React cập nhật DOM trong jsdom.
5. `expect(screen.getByText("Count: 1")).toBeInTheDocument()` — Vitest assert matcher DOM.
6. (Playwright) `npx playwright test`: mở browser thật, `page.goto("/")`, fill/click bằng locator (auto-wait), assert `toBeVisible()`; retry/failure trace giúp debug.
7. Kết quả: pass/fail per test; Vitest có watch + coverage; Playwright có HTML report/trace viewer.
8. Coverage: `vitest --coverage` (cần `@vitest/coverage-v8`) báo % theo file — dùng để tìm vùng chưa test, không phải mục tiêu tuyệt đối.

## Ví dụ chi tiết
```tsx
// example.tsx — DAY 21: component mẫu dễ test (Counter)
import { useState } from "react";

export default function App() {
  const [count, setCount] = useState(0);
  return (
    <>
      <p>Count: {count}</p>
      <button onClick={() => setCount((c) => c + 1)}>+1</button>
    </>
  );
}

// Counter.test.tsx (tạo cạnh file này khi cần):
// import { render, screen } from "@testing-library/react";
// import userEvent from "@testing-library/user-event";
// import { expect, test } from "vitest";
// import App from "./example";
// test("bấm +1 tăng count", async () => {
//   render(<App />);
//   await userEvent.click(screen.getByRole("button", { name: "+1" }));
//   expect(screen.getByText("Count: 1")).toBeInTheDocument();
// });
```

```ts
// vitest + RTL setup
// vite.config.ts
import { defineConfig } from "vitest/config";
export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test-setup.ts"], // import "@testing-library/jest-dom"
    globals: true,                       // dùng test/expect toàn cục nếu muốn
  },
});
```

```ts
// e2e/login.spec.ts — Playwright `npm init playwright@latest`
import { test, expect } from "@playwright/test";
test("login thành công", async ({ page }) => {
  await page.goto("/");
  await page.getByPlaceholder("Email").fill("a@b.com");
  await page.getByRole("button", { name: "Login" }).click();
  await expect(page.getByText("Welcome")).toBeVisible();
});
```

## Giải thích từng phần
- `render(<App/>)`: mount component trong jsdom; trả về `container`/`unmount` nếu cần, nhưng phổ biến dùng `screen` toàn cục.
- `screen.getByRole("button", { name: "+1" })`: query theo **role** (a11y) + accessible name — bền vững trước refactor style/class. Đây là "linh hồn" của RTL.
- `await userEvent.click(...)`: user-event v2/v14 async — mô phỏng nhiều bước như người thật; nhớ `await`.
- `expect(...).toBeInTheDocument()`: matcher jest-dom mở rộng — cần import setup một lần.
- Playwright `getByPlaceholder`/`getByRole`: locator **auto-wait** — không cần `sleep`; retry mặc định cho assertion (`toBeVisible` poll).
- `test("...", async () => {})`: Vitest API giống Jest (`describe/it/expect`) — dễ chuyển từ Angular/Jasmine; `vitest` chạy song song, nhanh nhờ Vite.
- **`findBy*` cho bất đồng bộ:** `await screen.findByText(...)` chờ element xuất hiện (thay `waitFor` thủ công).
- **`renderHook`:** test custom hook độc lập không cần component UI (DAY 16).
- **MSW:** chặn ở tầng network, trả response giả — test sát thực tế và tái dùng cho cả dev/browser.

## Bảng so sánh Angular ↔ React + Vite
| Angular | React + Vite | Ghi chú |
|---|---|---|
| Karma + Jasmine | Vitest | API gần Jest, chạy trên Vite |
| `TestBed.configureTestingModule` | `render()` của RTL | Không cần module/DI trong test đơn giản |
| `fixture.detectChanges()` | RTL tự cập nhật (act) | RTL wrap state update |
| `By.css('.btn')` | `getByRole`/`getByLabelText`/`getByText` | Ưu tiên accessibility |
| `dispatchEvent` | `userEvent` (mô phỏng thật) | user-event khuyên dùng |
| Protractor / Cypress | Playwright | Đa browser + auto-wait |
| `HttpTestingController` mock HTTP | MSW (Mock Service Worker) | Cùng ý tưởng mock tầng network |
| `fixture.nativeElement` | `screen` (document.body) | Query toàn cục |
| `jasmine.createSpy` | `vi.fn()` / `vi.spyOn` | Cùng ý mock/spy |

## Lỗi thường gặp (Common pitfalls)
- **Query theo class/testid nội bộ** (`container.querySelector('.btn')`) → test vỡ khi đổi style. → Fix: `getByRole`/`getByLabelText` trước; `getByTestId` là lựa chọn cuối.
- **Quên `await userEvent.*`** → assertion chạy trước khi update xong → flaky. → Fix: luôn await; dùng `findBy*` cho element xuất hiện bất đồng bộ.
- **Quên import `@testing-library/jest-dom` trong setup** → `toBeInTheDocument is not a function`. → Fix: `setupFiles` import một lần.
- **Test trùng với implementation** (assert state/`useState` call count) → khó bảo trì, không phản ánh hành vi. → Fix: assert UI/người dùng thấy gì.
- **E2E dùng `page.waitForTimeout(1000)`** → flaky + chậm. → Fix: dùng locator auto-wait / `expect().toBeVisible()`.
- **Không reset mock giữa các test** → state rò rỉ gây fail ngẫu nhiên. → Fix: `beforeEach(() => vi.clearAllMocks())`, cleanup RTL tự động (RTL auto-cleanup khi dùng Vitest globals).
- **Test lệch với `StrictMode`/async update** → warning `act(...)`. → Fix: dùng `await userEvent`/`waitFor` để bao update.
- **Test phụ thuộc timeout thật** (`setTimeout` trong hook) → chậm/flaky. → Fix: `vi.useFakeTimers()` + `advanceTimersByTime`.
- **Không dọn DOM giữa các test** → element cũ rò rỉ, `getBy*` báo nhiều kết quả. → Fix: RTL auto-cleanup (bật `globals`) hoặc `cleanup()` sau mỗi test.

## Best practices / Mẹo
- **Kim tự tháp test:** nhiều unit/integration (Vitest + RTL) + ít E2E (Playwright) cho luồng trọng yếu — chi phí chạy ngược lại với độ tin cậy.
- Test theo **hành vi**: viết test bằng ngôn ngữ người dùng ("bấm +1, thấy Count: 1") — dễ đọc, khó vỡ khi refactor.
- Hook: test bằng `renderHook` của RTL; logic thuần: test hàm thường (không cần render).
- Mock network bằng **MSW** thay vì mock `fetch` thủ công — test sát thực tế, tái dùng được cả browser.
- Playwright: dùng `storageState` để login một lần cho nhiều test; bật trace/video khi CI; chạy matrix Chromium/Firefox/WebKit.
- Với TanStack Query trong test: bọc `QueryClientProvider` với client mới mỗi test + `retry: false`.
- **Đặt tên test như câu chuyện người dùng** ("hiển thị lỗi khi email trống") — tài liệu sống cho hành vi.
- **Chạy E2E trên CI với browser thật**, giữ suite nhỏ và ổn định; unit/integration chạy nhanh ở local.

## Bài tập nhỏ
1. Viết `Counter.test.tsx` cho `example.tsx` gồm 2 test: (a) hiển thị "Count: 0" lúc đầu; (b) bấm +1 hai lần → "Count: 2". Chạy `npx vitest`.
2. Tạo `e2e/counter.spec.ts` với Playwright: mở app, click `+1` 3 lần, assert "Count: 3"; chạy `npx playwright test --project=chromium` và mở HTML report khi fail.
3. Viết `renderHook` test cho `useDebounce` (DAY 16) dùng fake timers.
4. Thêm MSW mock API cho `useFetch`/`useQuery` và test trạng thái loading → success.
5. Bật coverage và bổ sung test cho nhánh error của một component.

## Reference
- https://vitest.dev/
- https://testing-library.com/docs/react-testing-library/intro/
- https://testing-library.com/docs/user-event/intro/
- https://playwright.dev/
- https://mswjs.io/