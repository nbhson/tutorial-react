# DAY 21 — Hỏi & Đáp: Testing & E2E

> File hỏi–đáp chi tiết cho `3_react-tutorial/21-testing-e2e`.
> Đọc kèm: `README.md` (lý thuyết) + `example.tsx` (Counter dễ test + mẫu test注释 chạy được).

---

## 1. Bộ ba Vitest + RTL + Playwright mỗi cái làm gì?

**Hỏi:** Ba công cụ này có thay thế nhau không?

**Đáp:**
- **Không — 3 tầng khác nhau**, thay Karma/Jasmine + TestBed + Protractor/Cypress của Angular:
  - **Vitest** — runner unit/integration: nhanh, chung config Vite, API vui vẻ, chạy jsdom + watch + coverage.
  - **RTL (React Testing Library)** — render component + query theo accessibility trong jsdom.
  - **Playwright** — E2E browser thật (Chromium/Firefox/WebKit) cho luồng xuyên trang.
- Phân tầng: unit (hàm thuần, hook via `renderHook`) → integration (component + `user-event`) → E2E (luồng + browser thật).

---

## 2. Triết lý RTL "test hành vi" nghĩa là gì?

**Hỏi:** Vì sao không assert `count` state trực tiếp cho nhanh?

**Đáp:**
- Châm ngôn RTL: *"càng giống cách phần mềm được dùng, test càng đáng tin"*.
  Query qua `getByRole`, `getByLabelText`, `getByText` (thứ user thấy/sờ) thay vì chọc state/props/hàm nội bộ.
- Lợi ích: refactor nội bộ (đổi tên state, tách component) **không vỡ test** — chỉ vỡ khi hành vi user đổi,
  đúng thứ cần báo động. Assert state nội bộ thì refactor nào cũng đỏ, test thành gánh nặng.

---

## 3. `render` + `screen` + `userEvent` + `toBeInTheDocument` là bộ gì?

**Hỏi:** Mỗi mảnh trong mẫu test example làm gì?

**Đáp:**
- `render(<App/>)` — mount component vào container DOM trong jsdom (≈ `TestBed.createComponent`).
- `screen` — cầu truy vấn DOM sau render (`getByRole("button", { name: "+1" })` tìm nút theo role + tên accessible).
- `userEvent.click()` — mô phỏng pointer + focus + click **thật** (hơn `fireEvent` low-level chỉ bắn event).
  Nhớ `await` vì user-event là async.
- `toBeInTheDocument()` — matcher của `@testing-library/jest-dom` assert node tồn tại (thân thiện hơn `toBeTruthy`).

```tsx
render(<App />);
await userEvent.click(screen.getByRole("button", { name: "+1" }));
expect(screen.getByText("Count: 1")).toBeInTheDocument();
```

---

## 4. Vì sao test dùng role/label? Liên quan a11y và DAY 11/17?

**Hỏi:** `getByRole` bắt buộc button có accessible name — liên quan gì đến code prod?

**Đáp:**
- Liên quan trực tiếp: test query được **khi và chỉ khi** UI accessible thật (button có text/`aria-label`,
  input có `label`/`htmlFor` — đúng best practice DAY 1/11/17). Test theo role vì thế **ép code prod accessible hơn**.
- Viết test trước mà query không ra là tín hiệu UI thiếu a11y — sửa component, không sửa test để query dễ
  (tránh `container.querySelector` chọc implementation).

---

## 5. Playwright auto-wait là gì? Hơn sleep tay ở đâu?

**Hỏi:** E2E chờ element load thì `sleep(2000)` được không?

**Đáp:**
- **Không nên.** `sleep` cứng: mạng nhanh thì chờ thừa, mạng chậm thì vẫn flake.
  Playwright locator (`page.getByRole(...)`) **tự chờ** tới khi element sẵn sàng (actionable/assertable) rồi mới
  thao tác — nhanh khi được, kiên nhẫn khi cần, retry có trace.
- Kèm failure trace + HTML report: test đỏ mở trace xem lại từng bước như video — debug E2E nhẹ hơn hẳn log chay.

---

## 6. Cấu hình Vitest tối thiểu cho project Vite là gì?

**Hỏi:** Lôi Vitest vào app cần mấy dòng config?

**Đáp:**
- 3 thứ (đúng như project `5_react-crud-jsonplaceholder` đã làm):
  1. `vite.config.ts`: `test: { environment: "jsdom", setupFiles: ["./src/test-setup.ts"] }`.
  2. `src/test-setup.ts`: `import "@testing-library/jest-dom/vitest"`.
  3. Deps: `vitest`, `jsdom`, `@testing-library/react`, `@testing-library/jest-dom` (+ `user-event` khi cần click/type).
- Coverage khi cần: `vitest --coverage` (+ `@vitest/coverage-v8`) — dùng để **tìm vùng chưa test**,
  không phải mục tiêu % tuyệt đối.

---

## 7. `findBy*` + `waitFor`: element xuất hiện bất đồng bộ thì chờ kiểu gì?

**Hỏi:** Component fetch user rồi mới hiện tên — `getByText` ngay sau render có ra không?

**Đáp:**
- Không ra — `getBy*` query **đồng bộ ngay lúc gọi**, fetch chưa về thì DOM chưa có tên, test đỏ oan "Unable to find". Cơ chế đúng: `findBy*` là bản promise của `getBy*` — poll tới khi element xuất hiện (mặc định timeout ~1s) rồi mới resolve; `waitFor(() => expect(...))` cho assertion phức tạp hơn một node.
- Vì sao không `sleep(500)` rồi `getBy`: mạng nhanh thì chờ thừa, CI chậm thì vẫn flake — `findBy` nhanh khi được (về sớm resolve sớm), kiên nhẫn khi cần, đúng triết lý auto-wait như Playwright (câu 5) nhưng ở tầng jsdom.
- Sai thì sao: dùng `getBy` cho UI async là flake theo timing; dùng `findBy` cho UI đồng bộ (Counter) là thừa await. Fix: đồng bộ → `getBy`, async (fetch/timer/debounce) → `findBy`/`waitFor`. Nhớ `await` cả `userEvent` lẫn `findBy`.

```tsx
// Minh họa ý tưởng: chờ tên user sau fetch (không sleep cứng)
// import { render, screen } from "@testing-library/react";
// render(<UserCard />); // mount xong, fetch đang bay, tên chưa có
// expect(await screen.findByText("Son Nguyen")).toBeInTheDocument(); // poll tới khi hiện
// Cơ chế: findBy = getBy + retry async, về sớm thì pass sớm, không chờ thừa
```

---

## 8. Test hook độc lập: `renderHook` cho `useDebounce`/`useToggle` (DAY 16)?

**Hỏi:** Hook không render UI thì `render(<Comp/>)` kiểu gì, assert `result.current` ra sao?

**Đáp:**
- Không render component — RTL có `renderHook(() => useToggle())` mount hook trong component test vô hình, trả `result.current` (giá trị hook trả) và `rerender`/`act` để tương tác. Logic test độc lập khỏi UI, đúng ranh giới "hook tách logic" của DAY 16.
- Cơ chế `act`: mọi `setState` trong hook (bấm toggle, tua debounce) phải bọc `act(() => ...)` để React flush update trước khi assert — `userEvent` đã tự bọc nên quên ít lộ, `renderHook` gọi tay nên quên là warning `act(...)` + assert giá trị cũ.
- Sai thì sao: dựng component giả chỉ để test hook (thừa UI, test lẫn UI vào logic). Hoặc assert `result.current` ngay sau kích hoạt async mà không `waitFor`/tua timer (câu 7/10) — tưởng hook sai. Fix: hook → `renderHook` + `act`, async → thêm chờ.

```tsx
// Minh họa ý tưởng test useToggle độc lập (không cần UI)
// import { renderHook, act } from "@testing-library/react";
// const { result } = renderHook(() => useToggle()); // mount hook, lấy API trả về
// expect(result.current[0]).toBe(false); // ban đầu tắt
// act(() => { result.current[1](); }); // gọi toggle trong act để flush update
// expect(result.current[0]).toBe(true); // đã bật sau toggle
```

---

## 9. Mock network bằng MSW thay vì mock `fetch` tay: vì sao sát thực tế hơn?

**Hỏi:** `vi.spyOn(global, "fetch")` trả JSON giả cũng xanh, cần gì MSW?

**Đáp:**
- Mock `fetch` tay chỉ chặn **đúng hàm `fetch`** — code chuyển sang axios/ky là test mù, và mock ở tầng hàm nên không kiểm được URL/method/header thật. MSW (Mock Service Worker) chặn ở **tầng network** (intercept request): mọi lib gọi HTTP đều qua, assert được `req.url`/`method`, trả `HttpResponse.json(...)` như server thật.
- Cơ chế tái dùng: cùng handler MSW dùng cho test (Vitest), dev (browser) và E2E seed — một nguồn giả lập, không viết 3 bộ mock. Test `useFetch`/`useQuery` (DAY 12/16) bao được cả 3 trạng thái loading → success → error bằng 3 handler khác nhau.
- Sai thì sao: mock `fetch` trả shape sai với server thật thì test xanh mà prod đỏ (lệch contract). Fix: handler MSW viết theo contract API thật (dùng chung schema Zod DAY 11 nếu được), test assert UI theo từng trạng thái.

| Cách mock | Chặn ở tầng | Được / mất |
|---|---|---|
| `vi.spyOn(fetch)` | Hàm `fetch` | Nhanh nhưng chỉ đúng `fetch`, dễ lệch contract |
| MSW | Network (request) | Mọi lib đều qua, assert URL/method, tái dùng dev/E2E |
| Không mock, gọi API thật | Server thật | Flake + chậm + bẩn dữ liệu — chỉ E2E staging mới làm |

---

## 10. Timer giả `vi.useFakeTimers()`: test debounce/countdown không chờ thật?

**Hỏi:** `useDebounce` 300ms mà test chờ 300ms thật cho mỗi case có ổn không?

**Đáp:**
- Không ổn ở scale: 20 case × chờ thật + CI chậm là phút chờ + flake khi máy tải nặng. Cơ chế fake timers: `vi.useFakeTimers()` thay đồng hồ, `act(() => vi.advanceTimersByTime(300))` tua 300ms tức thì — `setTimeout` trong hook chạy ngay, assert `result.current`/DOM sau tua. Xong phải `vi.useRealTimers()` để không đầu độc test khác (timer giả sót làm `findBy` treo).
- Nối câu 7: `findBy` poll bằng timer thật — đang fake timer mà gọi `findBy` không tua là treo tới timeout. Quy tắc: fake timer thì **chủ động tua** cho mọi chờ, hoặc chỉ fake trong test hook thuần (câu 8) và giữ timer thật cho test component async.
- Sai thì sao: quên `act` khi tua thì update chưa flush — assert giá trị cũ. Quên trả timer thật thì test sau flake lạ. Fix: `act(tua) → assert → useRealTimers` thành bộ ba khép kín mỗi test timer.

```tsx
// Minh họa bộ ba khép kín cho test timer (không chờ thật)
// import { vi } from "vitest";
// vi.useFakeTimers(); // thay đồng hồ thật bằng giả
// act(() => { vi.advanceTimersByTime(300); }); // tua 300ms trong act để flush update
// expect(...).toBe(...); // assert sau khi timer đã chạy xong
// vi.useRealTimers(); // trả đồng hồ thật, không đầu độc test sau
```

---

## 11. Query trong test + E2E gọn: `QueryClientProvider` mỗi test và `storageState`?

**Hỏi:** Component dùng `useQuery` render trong test báo thiếu Provider, E2E nào cũng login lại từ đầu — fix sao?

**Đáp:**
- **Test Query**: `useQuery` đòi `QueryClientProvider` phía trên (như Context DAY 7) — render trần là lỗi "No QueryClient set". Fix: bọc mỗi test một `QueryClient` mới (`new QueryClient({ defaultOptions: { queries: { retry: false } } })`) — `retry: false` để fail nhanh (không retry 3 lần làm test chậm), client mới mỗi test để cache không rò giữa các test. Đây chính là "Provider đặt sát + state sạch" của DAY 7 áp dụng cho test.
- **E2E Playwright**: mỗi spec login lại từ UI (fill + click + chờ) cho 20 spec là 20 lần chờ + dễ flake khi trang login chậm. Fix: `storageState` — login **một lần** ở setup, lưu cookie/storage vào file, các spec khác nạp file đó là đã login, đi thẳng vào luồng cần test (checkout, admin). Kèm trace/video ở CI để test đỏ mở ra xem như video.
- Sai thì sao: dùng chung một QueryClient cho cả file test thì test A nạp cache làm test B pass oan (phụ thuộc thứ tự). E2E không storageState thì suite chậm gấp bội + flake login lan sang mọi spec.

```tsx
// Minh họa bọc Query đúng cho mỗi test (không dùng chung client giữa các test)
// import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// const makeClient = () => new QueryClient({ defaultOptions: { queries: { retry: false } } });
// render(
//   <QueryClientProvider client={makeClient()}> {/* client mới mỗi test, fail nhanh không retry */}
//     <UserList />
//   </QueryClientProvider>
// );
```

```ts
// Minh họa E2E login một lần, tái dùng cho nhiều spec (Playwright storageState)
// // setup/login.setup.ts: login thật 1 lần, lưu vào file
// await page.getByPlaceholder("Email").fill("a@b.com");
// await page.getByRole("button", { name: "Login" }).click();
// await page.context().storageState({ path: "e2e/.auth.json" });
// // spec khác: nạp file là đã login, không fill lại
// // test.use({ storageState: "e2e/.auth.json" });
```

---

## Reference

- `README.md` + `example.tsx` trong cùng thư mục (DAY 21)
- https://vitest.dev/ · https://testing-library.com/docs/react-testing-library/intro/
- https://playwright.dev/ (locator, auto-wait, trace viewer)
