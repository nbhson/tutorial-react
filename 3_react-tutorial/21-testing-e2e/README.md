# DAY 21: TESTING & E2E

## Mục tiêu bài học
- Nắm bộ đôi chuẩn 2026: **Vitest + React Testing Library (RTL)** cho unit/integration và **Playwright** cho E2E.
- Hiểu triết lý RTL: test theo **hành vi người dùng** (role/label/text), không test chi tiết implementation (state, tên hàm nội bộ).
- Biết phân tầng test (unit/integration/E2E) và viết được test đầu tiên với `user-event`.

## Khái niệm cốt lõi (Core)

### 1. Bộ ba 2026: Vitest + RTL + Playwright
Angular: Karma/Jasmine + TestBed + Protractor/Cypress. React + Vite: **Vitest** (chạy trên Vite, config chung, API Jest-like, song song, watch, coverage v8) + **RTL** (render vào jsdom, query theo a11y) + **Playwright** (browser thật Chromium/Firefox/WebKit, auto-wait, trace). Mỗi tầng một việc, không thay nhau.

```ts
// vite.config.ts — Vitest dùng chung config Vite (alias, plugin) nên không config 2 nơi:
import { defineConfig } from "vitest/config";
export default defineConfig({
  test: {
    environment: "jsdom", // DOM giả (nhanh, không browser) cho unit/integration
    setupFiles: ["./src/test-setup.ts"], // 1 dòng: import "@testing-library/jest-dom" (toBeInTheDocument)
    globals: true, // test/expect/describe toàn cục (khỏi import mỗi file) + auto-cleanup
  },
});
// src/test-setup.ts: import "@testing-library/jest-dom"; // matcher DOM thân thiện
```

Vì sao jsdom cho unit mà browser cho E2E? Vì jsdom nhanh (ms) nhưng giả (không layout/paint/animation thật) — đủ cho logic + tương tác. E2E cần thật (multi-page, auth, network, visual) — Playwright browser thật + auto-wait + video/trace khi fail.

### 2. Triết lý RTL — test như user dùng
"The more your tests resemble the way your software is used, the more confidence they can give you." Query theo `getByRole` (nut, textbox, heading) + `getByLabelText` (label) + `getByText` (nội dung) — những gì user (kể cả screen reader) nhận biết. Không `querySelector(".btn-primary")` (đổi class là vỡ dù hành vi đúng), không assert `useState` call count (implementation).

```tsx
// example.tsx Counter: test hỏi "user thấy gì" sau "user làm gì":
render(<App />);
await user.click(screen.getByRole("button", { name: "+1" })); // tìm nút như user (role + tên đọc được)
expect(screen.getByText("Count: 1")).toBeInTheDocument(); // assert text user thấy
// Đổi class/style/component nội bộ mà role/text giữ -> test vẫn xanh. Đổi ".btn" query là đỏ oan.
```

`getBy*` (đồng bộ, không thấy là ném ngay) vs `findBy*` (async, chờ xuất hiện — cho fetch/Suspense) vs `queryBy*` (không thấy trả null — cho assert "không tồn tại"). Sai là `getBy` cho element async (flaky) hoặc `findBy` cho sync (chậm).

### 3. `render` + `screen` + `user-event` (không phải `fireEvent`)
`render(<App/>)` mount vào container jsdom (tương đương `TestBed.createComponent` nhưng không module/DI). `screen` query toàn cục (`document.body`). `user-event` mô phỏng nhiều bước như người (hover → focus → pointerdown → click → blur), async nên `await`. `fireEvent.click` chỉ dispatch 1 event (rẻ nhưng giả — bỏ qua focus/hover behavior).

```tsx
const user = userEvent.setup(); // v14 setup 1 lần mỗi test
await user.click(screen.getByRole("button", { name: "+1" })); // nhớ await — quên là assert chạy trước update (flaky)
await user.keyboard("Son"); // gõ như người (từng phím + onChange từng cái)
```

### 4. `toBeInTheDocument` + `renderHook` + MSW
`toBeInTheDocument()` từ `jest-dom` (cần setup import 1 lần, không là "not a function"). `renderHook(() => useDebounce(x))` test hook không cần UI (kết hợp fake timer). MSW chặn ở tầng network (trả JSON giả cho fetch/XHR) — test `useFetch`/`useQuery` sát thật (loading → success/error) mà không mock `fetch` tay (mock tay bỏ qua check `ok`/parse).

### 5. Playwright E2E — luồng trọng yếu, browser thật
`page.goto` + locator `getByRole/getByPlaceholder` (auto-wait: chưa có thì poll, không `sleep`) + `expect().toBeVisible()` (retry mặc định) + `storageState` (login 1 lần dùng nhiều test) + trace/video khi CI fail. Test ít (login, checkout) vì chậm/đắt; logic để Vitest/RTL.

```ts
// e2e/login.spec.ts — npm init playwright@latest
import { test, expect } from "@playwright/test";
test("login thành công", async ({ page }) => {
  await page.goto("/"); // baseURL config, không hardcode localhost:5173 mỗi test
  await page.getByPlaceholder("Email").fill("a@b.com"); // auto-wait tới khi fill được
  await page.getByRole("button", { name: "Login" }).click();
  await expect(page.getByText("Welcome")).toBeVisible(); // poll tới khi hiện (không sleep)
});
```

### 6. Phân tầng — kim tự tháp
Unit (hàm thuần `move`/`vnd`, hook `renderHook`) nhiều + nhanh; Integration (component + user-event: Counter bấm → text) nhiều vừa; E2E (Playwright xuyên trang) ít (luồng tiền). Chi phí chạy ngược với độ tin cậy (E2E tin nhất, chậm nhất). Coverage để tìm vùng chưa test, không phải mục tiêu 100% mù.

### Keyword chính
Vitest (`test`/`expect`/`vi.fn`/`vi.useFakeTimers`/`--coverage`), RTL (`render`/`screen`/`getByRole`/`findBy*`/`renderHook`), `user-event` (setup + await, thật hơn fireEvent), jest-dom (`toBeInTheDocument`), MSW (mock network), Playwright (`page.getByRole`, auto-wait, `toBeVisible`, `storageState`, trace).

## Luồng hoạt động (Flow)
1. `npx vitest` (watch) / `vitest run` (CI): đọc `vite.config.ts`, jsdom + setup jest-dom, mỗi file `*.test.tsx` chạy song song (nhanh nhờ Vite transform).
2. Test mount: `render(<App/>)` — React mount vào div trong jsdom. `screen` trỏ `document.body`. Auto-cleanup sau mỗi test (globals) nên không rò DOM (không là `getBy*` thấy 2 nút 2 test).
3. `await user.click(getByRole("button", { name: "+1" }))`: RTL tìm theo a11y (role button + accessible name "+1" từ text content); user-event pointer + focus + click như người; React `setCount(c => c+1)`; RTL bọc `act` nên DOM cập nhật đồng bộ sau await.
4. `expect(getByText("Count: 1")).toBeInTheDocument()` — matcher jest-dom (cần setup). Fail là diff DOM rõ (thấy "Count: 0" thay vì "1").
5. Async (fetch): `render` → loading skeleton → `await screen.findByText("Son")` (poll tới khi fetch mock về) — không `waitForTimeout`. MSW trả JSON giả ở tầng network nên `r.ok`/parse chạy thật.
6. Hook: `renderHook(() => useDebounce("a", 300))` + `vi.useFakeTimers()` → `advanceTimersByTime(300)` → assert mới. Không chờ thật 300ms (chậm/flaky).
7. Playwright: `npx playwright test` mở browser thật → `goto` → locator auto-wait fill/click → assert `toBeVisible` (poll) → pass/fail + HTML report/trace (xem bước fail như video). `storageState` login 1 lần, test sau dùng lại (không login mỗi test).
8. Coverage `vitest --coverage` (cần `@vitest/coverage-v8`): % file/dòng/nhánh — tìm nhánh error chưa test để bổ sung, không chạy theo số tuyệt đối.

## Ví dụ chi tiết
Khớp 1-1 với `example.tsx` (Counter + 3 test + ghi chú async/hook/MSW/query):

```tsx
// example.tsx — DAY 21: Counter dễ test + test RTL + MSW + renderHook ý tưởng
// Mục đích: test hành vi user (role/text) — không chọc state/hàm nội bộ.
import { useState } from "react"; // (1) State count — test assert UI "Count: X", không assert state trực tiếp

export default function App() {
  const [count, setCount] = useState(0); // (2) Functional update để bấm nhanh không mất (kết hợp DAY 1/3)
  return (
    <>
      {/* (3) Text động "Count: {count}" — getByText assert theo những gì user thấy */}
      <p>Count: {count}</p>
      {/* (4) <button> semantic + tên "+1" rõ — getByRole("button", { name: "+1" }) bền trước refactor class */}
      <button onClick={() => setCount((c) => c + 1)}>+1</button>
      <button onClick={() => setCount(0)}>Reset</button>
    </>
  );
}

// Counter.test.tsx — đặt cạnh example.tsx khi chạy (Vitest + RTL + user-event):
// import { render, screen } from "@testing-library/react";
// import userEvent from "@testing-library/user-event"; // mô phỏng thật (pointer/focus/click), khác fireEvent low-level
// import { expect, test, beforeEach, vi } from "vitest";
// import App from "./example";
//
// beforeEach(() => vi.clearAllMocks()); // reset mock giữa các test — không rò state
//
// test("hiển thị Count: 0 lúc đầu", () => {
//   render(<App />); // mount vào jsdom (không browser thật nên nhanh)
//   expect(screen.getByText("Count: 0")).toBeInTheDocument(); // jest-dom matcher — cần setupFiles import 1 lần
// });
//
// test("bấm +1 hai lần -> Count: 2", async () => {
//   const user = userEvent.setup(); // v14: setup rồi dùng — mô phỏng async như người thật
//   render(<App />);
//   await user.click(screen.getByRole("button", { name: "+1" })); // query theo role + accessible name (a11y)
//   await user.click(screen.getByRole("button", { name: "+1" }));
//   expect(screen.getByText("Count: 2")).toBeInTheDocument(); // assert UI, không assert count state
// });
//
// test("Reset về 0", async () => {
//   const user = userEvent.setup();
//   render(<App />);
//   await user.click(screen.getByRole("button", { name: "+1" }));
//   await user.click(screen.getByRole("button", { name: "Reset" }));
//   expect(screen.getByText("Count: 0")).toBeInTheDocument();
// });

// Ghi chú mở rộng (xem README copy):
// - Async: await screen.findByText("Welcome") chờ xuất hiện (không waitForTimeout) — auto-wait.
// - Hook: renderHook(() => useDebounce(text, 300)) với vi.useFakeTimers() + advanceTimersByTime(300).
// - Network: MSW (msw) chặn fetch ở tầng network cho useFetch/useQuery — test loading->success->error.
// - Query: bọc QueryClientProvider client mới mỗi test + retry: false (không chờ retry khi lỗi).
// - E2E Playwright: page.getByRole auto-wait + toBeVisible (không waitForTimeout), storageState login 1 lần.
```

Vitest + RTL setup + Playwright + MSW/query (copy khi cần):

```ts
// vite.config.ts — test jsdom + setup jest-dom (đã ở Khái niệm, nhắc lại để copy)
import { defineConfig } from "vitest/config";
export default defineConfig({
  test: { environment: "jsdom", setupFiles: ["./src/test-setup.ts"], globals: true },
});
// src/test-setup.ts: import "@testing-library/jest-dom";
```

```ts
// e2e/login.spec.ts — Playwright (npm init playwright@latest)
import { test, expect } from "@playwright/test";
test("login thành công", async ({ page }) => {
  await page.goto("/"); // baseURL trong playwright.config.ts
  await page.getByPlaceholder("Email").fill("a@b.com"); // auto-wait
  await page.getByRole("button", { name: "Login" }).click();
  await expect(page.getByText("Welcome")).toBeVisible(); // retry poll, không sleep
});
```

```tsx
// MSW mock network cho useFetch/useQuery — test 3 trạng thái sát thật:
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
const server = setupServer(http.get("/api/users", () => HttpResponse.json([{ id: 1, name: "Son" }])));
beforeAll(() => server.listen()); afterEach(() => server.resetHandlers()); afterAll(() => server.close());
// Test: render -> getByText("Đang tải") -> findByText("Son") (thành công); server.use(http.get(..., () => new HttpResponse(null, { status: 500 }))) cho nhánh lỗi
```

```tsx
// renderHook + fake timer cho useDebounce (DAY 16):
import { renderHook, act } from "@testing-library/react";
vi.useFakeTimers();
const { result, rerender } = renderHook(({ v }) => useDebounce(v, 300), { initialProps: { v: "a" } });
rerender({ v: "ab" }); act(() => vi.advanceTimersByTime(300)); // ngừng đủ 300ms
expect(result.current).toBe("ab");
```

```tsx
// TanStack Query trong test: client mới mỗi test + retry false (không chờ retry khi lỗi):
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
render(<QueryClientProvider client={qc}><Users /></QueryClientProvider>);
```

## Giải thích từng phần
- Dòng `useState(0)` + functional `(c) => c + 1`: test bấm 2 lần nhanh không mất (stale). Vì sao functional quan trọng cho test? Vì user-event click 2 lần trước re-render xong mà `count + 1` snapshot cũ là chỉ +1 (test đỏ oan).
- Dòng `<p>Count: {count}</p>`: text user thấy — `getByText("Count: 2")` bền. Vì sao không `data-testid="count"`? Vì testid là implementation (user không thấy); text/role là hành vi. Testid chỉ khi không có role/text (canvas, icon).
- Dòng `<button>+1</button>`: semantic + accessible name "+1" (từ text). `getByRole("button", { name: "+1" })` tìm như screen reader — đổi class/style không vỡ. `<div onClick>+1</div>` là không role (test phải testid, a11y vỡ).
- Dòng `render(<App/>)`: mount jsdom, không browser. Vì sao nhanh? Vì không layout/paint/network thật. Đủ cho click/type/assert text. Cần layout/animation/network thật thì Playwright.
- Dòng `userEvent.setup()` + `await user.click`: v14 setup 1 lần (đúng docs), async như người (nhiều microtask). Quên `await` là assert trước khi React `act` xong — flaky (lúc xanh lúc đỏ). `fireEvent.click` sync 1 event — nhanh nhưng bỏ focus/hover (test input khan).
- Dòng `toBeInTheDocument()`: jest-dom — cần `setupFiles` import. Quên là "is not a function" (lỗi setup, không phải logic). Thông điệp fail rõ (expected ... to be in document, thấy ...).
- Dòng `beforeEach(vi.clearAllMocks())`: mock (`vi.fn()` spy API) rò giữa test là fail ngẫu nhiên (test A gọi 2 lần, test B đếm 3). RTL auto-cleanup DOM (globals) + clear mock tay là sạch cả hai.
- Dòng `findByText` (async): poll tới khi xuất hiện/timeout (cho fetch/Suspense). `getBy` sync ném ngay — dùng cho sync là đúng, cho async là flaky. `queryByText` null khi không có — dùng assert "không tồn tại" (`expect(queryByText("Lỗi")).toBeNull()`).
- Dòng MSW `setupServer/listen/reset/close`: chặn network thật (fetch/XHR đi qua) — `r.ok`/parse chạy như prod. Mock `global.fetch = vi.fn()` tay bỏ qua lớp đó (test xanh giả). `resetHandlers` mỗi test để case lỗi không rò sang case thành công.
- Dòng Query `retry: false` + client mới: lỗi không retry 2 lần (test nhanh), cache không rò giữa test (test A users, test B rỗng mà dùng chung client là B thấy cache A).
- Dòng Playwright `getByRole/getByPlaceholder` + `toBeVisible()`: auto-wait + retry poll — không `waitForTimeout(1000)` (flaky + chậm: nhanh thì chờ thừa, chậm thì vẫn fail). `storageState` login 1 lần (file) cho nhiều test (nhanh + ít phụ thuộc).

## Bảng so sánh Angular ↔ React + Vite
| Angular | React + Vite | Ghi chú |
|---|---|---|
| Karma + Jasmine (`describe/it/expect`) | Vitest (API Jest-like, Vite, song song) | Chuyển gần như giữ nguyên cú pháp |
| `TestBed.configureTestingModule` (module/DI) | `render()` RTL (trực tiếp, không module) | Đơn giản khi không DI phức tạp |
| `fixture.detectChanges()` ép vẽ | RTL tự `act` (không gọi tay) | Bọc update, không quên |
| `By.css('.btn')` (class) | `getByRole`/`getByLabelText`/`getByText` (a11y) | Bền trước refactor style |
| `dispatchEvent`/`triggerEventHandler` | `userEvent` (thật) > `fireEvent` (low-level) | user-event khuyên dùng cho integration |
| Protractor / Cypress | Playwright (đa browser + auto-wait + trace) | Chromium/Firefox/WebKit 1 API |
| `HttpTestingController` mock HTTP | MSW (tầng network, tái dùng dev/browser) | Sát thật hơn mock fetch tay |
| `fixture.nativeElement` | `screen` (`document.body` toàn cục) | Query 1 chỗ, auto-cleanup |
| `jasmine.createSpy`/`spyOn` | `vi.fn()` / `vi.spyOn` + `clearAllMocks` | Cùng mock/spy, nhớ reset |
| `fakeAsync`/`tick()` | `vi.useFakeTimers()` + `advanceTimersByTime` | Cùng giả thời gian cho debounce/timeout |

## Lỗi thường gặp (Common pitfalls)

### 1. Query class/testid nội bộ → refactor vỡ oan
```tsx
// ❌ SAI: đổi class là test đỏ dù hành vi đúng
expect(container.querySelector(".btn-primary")).not.toBeNull();
```
```tsx
// ✅ ĐÚNG: role/label/text (a11y) — đổi style không vỡ (như example)
expect(screen.getByRole("button", { name: "+1" })).toBeInTheDocument();
// Testid chỉ khi không role/text: getByTestId("chart-canvas")
```

### 2. Quên `await userEvent` → flaky
```tsx
// ❌ SAI: assert trước khi update xong (lúc xanh lúc đỏ)
user.click(screen.getByRole("button", { name: "+1" }));
expect(screen.getByText("Count: 1")).toBeInTheDocument(); // còn "Count: 0"
```
```tsx
// ✅ ĐÚNG: luôn await; async element thì findBy
await user.click(screen.getByRole("button", { name: "+1" }));
expect(screen.getByText("Count: 1")).toBeInTheDocument();
// Fetch: await screen.findByText("Son") (chờ, không getBy ngay)
```

### 3. Quên jest-dom setup → matcher không tồn tại
Mô tả: "toBeInTheDocument is not a function" — không phải logic sai mà setup thiếu. Fix: `setupFiles: ["./src/test-setup.ts"]` với `import "@testing-library/jest-dom"` 1 lần (xem mẫu trên).

### 4. Test implementation (state/call) → khó bảo trì
```tsx
// ❌ SAI: chọc nội bộ — đổi tên hàm là vỡ dù UI đúng
expect(setCount).toHaveBeenCalledTimes(2);
```
```tsx
// ✅ ĐÚNG: assert UI user thấy (như example 3 test)
expect(screen.getByText("Count: 2")).toBeInTheDocument();
```

### 5. E2E `waitForTimeout` → chậm + flaky
```ts
// ❌ SAI: nhanh thì chờ thừa, chậm thì vẫn fail
await page.waitForTimeout(1000); await expect(page.getByText("Welcome")).toBeVisible();
```
```ts
// ✅ ĐÚNG: auto-wait + retry poll (như example login)
await expect(page.getByText("Welcome")).toBeVisible(); // poll tới khi hiện/timeout config
```

### 6. Không reset mock/DOM → rò giữa test
Mô tả: mock đếm dồn, DOM test trước còn (2 nút "+1") → `getByRole` "found multiple". Fix: `beforeEach(vi.clearAllMocks())` + RTL auto-cleanup (globals) / `cleanup()` tay.

### 7. Warning `act(...)` (StrictMode/async) → bọc chưa đủ
Mô tả: `setState` sau `render` không trong `act` (fetch về sau test xong). Fix: `await userEvent`/`findBy`/`waitFor` (bọc act) thay vì `fireEvent` + assert sync. Không suppress warning.

### 8. Timeout thật cho debounce/interval → chậm/flaky
```tsx
// ❌ SAI: chờ thật 300ms mỗi test — suite chậm, CI flaky
await new Promise((r) => setTimeout(r, 350)); expect(...).toBe(...);
```
```tsx
// ✅ ĐÚNG: fake timer (như mẫu renderHook trên)
vi.useFakeTimers(); rerender({ v: "ab" }); act(() => vi.advanceTimersByTime(300));
```

## Best practices / Mẹo
- **Kim tự tháp:** nhiều unit/integration (Vitest/RTL, ms) + ít E2E (Playwright, giây) cho luồng tiền. Vì sao? Vì E2E tin nhất nhưng chậm/đắt/flaky hơn — phủ hết bằng E2E là CI giờ đồng hồ.
- **Hành vi, không implementation:** câu test như user ("bấm +1 hai lần, thấy Count: 2"). Vì sao? Để refactor (đổi class/tên hàm/tách component) không vỡ khi hành vi giữ.
- Hook `renderHook` + hàm thuần test trực tiếp (không render UI). Vì sao? Vì logic hook/hàm độc lập — test UI cho nó là phí + mờ (fail không biết do logic hay UI).
- MSW thay mock fetch tay. Vì sao? Vì MSW giữ `ok`/parse/headers thật + tái dùng dev/browser (mock 1 chỗ).
- Playwright `storageState` login 1 lần + trace/video CI + matrix 3 browser cho luồng tiền. Vì sao? Vì login mỗi test chậm + phụ thuộc; trace cho xem lại fail như video.
- Query trong test: client mới + `retry: false`. Vì sao? Để nhanh (không chờ retry) + cô lập (không cache rò).
- **Tên test như câu chuyện** ("hiển thị lỗi khi email trống") — tài liệu sống. Vì sao? Vì đọc tên là biết hành vi hệ thống, không mở code.

## Bài tập nhỏ
1. `Counter.test.tsx` 2 test (như example: đầu "Count: 0", +1 hai lần "Count: 2") + thêm Reset test. `npx vitest run` xanh. Đổi `querySelector(".btn")` thử vỡ khi đổi class?
2. Playwright `counter.spec.ts`: mở app, +1 ba lần, assert "Count: 3" (`--project=chromium`), fail thì mở HTML report/trace xem bước nào.
3. `renderHook` cho `useDebounce` (DAY 16) fake timer (mẫu trên) — assert trước delay giữ cũ, sau delay mới. Vì sao không chờ thật?
4. MSW cho `useFetch`/`useQuery`: loading (skeleton) → success (tên) → error (500 + `role="alert"`). Thiếu `resetHandlers` thì case lỗi rò sang case sau thế nào?
5. Coverage (`--coverage`) cho Counter + nhánh error form DAY 11 — bổ sung test tới khi nhánh error xanh. Coverage bao nhiêu là đủ (và khi nào số cao vẫn thiếu)?

## Reference
- https://vitest.dev/
- https://testing-library.com/docs/react-testing-library/intro/
- https://testing-library.com/docs/user-event/intro/
- https://playwright.dev/
- https://mswjs.io/
