# DAY 21: TESTING & E2E

## Mục tiêu bài học
- Nắm bộ đôi chuẩn 2026: **Vitest + React Testing Library (RTL)** cho unit/integration và **Playwright** cho E2E.
- Hiểu triết lý RTL: test theo **hành vi người dùng** (role/label/text), không test chi tiết implementation (state, tên hàm nội bộ).
- Biết phân tầng test (unit/integration/E2E) và viết được test đầu tiên với `user-event`.

## Khái niệm cốt lõi (Core)

### 1. Bộ ba 2026: Vitest + RTL + Playwright
Angular: Karma/Jasmine + TestBed + Protractor/Cypress. React + Vite: **Vitest** (chạy trên Vite, config chung, API Jest-like, song song, watch, coverage v8) + **RTL** (render vào jsdom, query theo a11y) + **Playwright** (browser thật Chromium/Firefox/WebKit, auto-wait, trace). Mỗi tầng một việc, không thay nhau.

> 📄 **Code ví dụ:** [`examples/01-1-bo-ba-2026-vitest-rtl-playwright.ts`](examples/01-1-bo-ba-2026-vitest-rtl-playwright.ts)

Vì sao jsdom cho unit mà browser cho E2E? Vì jsdom nhanh (ms) nhưng giả (không layout/paint/animation thật) — đủ cho logic + tương tác. E2E cần thật (multi-page, auth, network, visual) — Playwright browser thật + auto-wait + video/trace khi fail.

> **Tóm gọn 1 câu:** Vitest + RTL chạy trong "hộp giấy" jsdom cho nhanh, Playwright mở hẳn trình duyệt thật cho tin — mỗi tầng một giá cả.


### 2. Triết lý RTL — test như user dùng
"The more your tests resemble the way your software is used, the more confidence they can give you." Query theo `getByRole` (nut, textbox, heading) + `getByLabelText` (label) + `getByText` (nội dung) — những gì user (kể cả screen reader) nhận biết. Không `querySelector(".btn-primary")` (đổi class là vỡ dù hành vi đúng), không assert `useState` call count (implementation).

> 📄 **Code ví dụ:** [`examples/02-2-triet-ly-rtl-test-nhu-user-dung.tsx`](examples/02-2-triet-ly-rtl-test-nhu-user-dung.tsx)

`getBy*` (đồng bộ, không thấy là ném ngay) vs `findBy*` (async, chờ xuất hiện — cho fetch/Suspense) vs `queryBy*` (không thấy trả null — cho assert "không tồn tại"). Sai là `getBy` cho element async (flaky) hoặc `findBy` cho sync (chậm).

> **Tóm gọn 1 câu:** RTL dạy test như user đọc trang: nhìn theo role/label/text, không bóc máy móc xem bên trong lắp ráp thế nào.


### 3. `render` + `screen` + `user-event` (không phải `fireEvent`)
`render(<App/>)` mount vào container jsdom (tương đương `TestBed.createComponent` nhưng không module/DI). `screen` query toàn cục (`document.body`). `user-event` mô phỏng nhiều bước như người (hover → focus → pointerdown → click → blur), async nên `await`. `fireEvent.click` chỉ dispatch 1 event (rẻ nhưng giả — bỏ qua focus/hover behavior). Hãy hình dung: `fireEvent` là người rủa giả tiếng khạc, `user-event` là diễn viên vào vai — đi hết động tác thật.

> 📄 **Code ví dụ:** [`examples/03-3-render-screen-user-event-khong-phai-fireevent.tsx`](examples/03-3-render-screen-user-event-khong-phai-fireevent.tsx)

> **Tóm gọn 1 câu:** `user-event` diễn lại nguyên chuỗi động tác của người thật nên đáng tin hơn `fireEvent` bắn sự kiện đơn lẻ — đừng tiết kiệm công diễn.


### 4. `toBeInTheDocument` + `renderHook` + MSW
`toBeInTheDocument()` từ `jest-dom` (cần setup import 1 lần, không là "not a function"). `renderHook(() => useDebounce(x))` test hook không cần UI (kết hợp fake timer). MSW chặn ở tầng network (trả JSON giả cho fetch/XHR) — test `useFetch`/`useQuery` sát thật (loading → success/error) mà không mock `fetch` tay (mock tay bỏ qua check `ok`/parse). Ví von: MSW như lễ tân đứng chặn ở sảnh — khách nào cũng qua quầy, không ai chui cửa sau.

> **Tóm gọn 1 câu:** jest-dom cho matcher dễ đọc, `renderHook` cho hook không cần UI, MSW chặn mạng ở tầng request — ba món hoàn thiện hộp đồ test.


### 5. Playwright E2E — luồng trọng yếu, browser thật
`page.goto` + locator `getByRole/getByPlaceholder` (auto-wait: chưa có thì poll, không `sleep`) + `expect().toBeVisible()` (retry mặc định) + `storageState` (login 1 lần dùng nhiều test) + trace/video khi CI fail. Test ít (login, checkout) vì chậm/đắt; logic để Vitest/RTL.

> 📄 **Code ví dụ:** [`examples/04-5-playwright-e2e-luong-trong-yeu-browser-that.ts`](examples/04-5-playwright-e2e-luong-trong-yeu-browser-that.ts)

> **Tóm gọn 1 câu:** Playwright dùng cho ít luồng đắt tiền nhất (login, thanh toán) — như chiêu khách VIP: ít nhưng mỗi lần phải tận tay.


### 6. Phân tầng — kim tự tháp
Unit (hàm thuần `move`/`vnd`, hook `renderHook`) nhiều + nhanh; Integration (component + user-event: Counter bấm → text) nhiều vừa; E2E (Playwright xuyên trang) ít (luồng tiền). Chi phí chạy ngược với độ tin cậy (E2E tin nhất, chậm nhất). Coverage để tìm vùng chưa test, không phải mục tiêu 100% mù.

> **Tóm gọn 1 câu:** Kim tự tháp test: đáy là hàng nghìn unit rẻ-nhanh, đỉnh là vài E2E đắt-chậm cho luồng tiền — đừng dựng đỉnh trước đáy.

### Keyword chính
Vitest (`test`/`expect`/`vi.fn`/`vi.useFakeTimers`/`--coverage`), RTL (`render`/`screen`/`getByRole`/`findBy*`/`renderHook`), `user-event` (setup + await, thật hơn fireEvent), jest-dom (`toBeInTheDocument`), MSW (mock network), Playwright (`page.getByRole`, auto-wait, `toBeVisible`, `storageState`, trace).

## Luồng hoạt động (Flow)
Mục này đi qua 8 bước theo đúng trình tự một vòng đời test: từ lúc chạy lệnh, mount component, giả lập thao tác, assert, cho tới test async, hook, E2E và coverage — đọc theo thứ tự để thấy "một ca test sống" trông thế nào.
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

> 📄 **Code ví dụ:** [`examples/05-vi-du-chi-tiet.tsx`](examples/05-vi-du-chi-tiet.tsx)

Vitest + RTL setup + Playwright + MSW/query (copy khi cần):

> 📄 **Code ví dụ:** [`examples/06-vi-du-chi-tiet.ts`](examples/06-vi-du-chi-tiet.ts)

> 📄 **Code ví dụ:** [`examples/07-vi-du-chi-tiet.ts`](examples/07-vi-du-chi-tiet.ts)

> 📄 **Code ví dụ:** [`examples/08-vi-du-chi-tiet.tsx`](examples/08-vi-du-chi-tiet.tsx)

> 📄 **Code ví dụ:** [`examples/09-vi-du-chi-tiet.tsx`](examples/09-vi-du-chi-tiet.tsx)

> 📄 **Code ví dụ:** [`examples/10-vi-du-chi-tiet.tsx`](examples/10-vi-du-chi-tiet.tsx)

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
Mục này là "cuốn từ điển song ngữ" cho người từ Angular sang: cột trái là thứ bạn quen, cột giữa là bản dịch React + Vite, cột phải nói thêm khi nào dịch "thật lòng".
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

> **Cách đọc bảng này:** mỗi dòng là một công cụ cũ ↔ mới; đọc cột Ghi chú để biết chỗ nào "chuyển gần như 1-1" (Karma → Vitest) và chỗ nào "khác triết lý" (class a11y → role a11y) — chỗ khác triết lý mới là chỗ cần học.

## Lỗi thường gặp (Common pitfalls)
Mục này gom 8 cái bẫy hay gặp nhất khi mới viết test React — mỗi cái có mã ví dụ chạy được để thấy lỗi "văn mình" (fail không vì logic sai mà vì viết sai kiểu test).

### 1. Query class/testid nội bộ → refactor vỡ oan
> 📄 **Code ví dụ:** [`examples/11-1-query-class-testid-noi-bo-refactor-vo.tsx`](examples/11-1-query-class-testid-noi-bo-refactor-vo.tsx)
> 📄 **Code ví dụ:** [`examples/12-1-query-class-testid-noi-bo-refactor-vo.tsx`](examples/12-1-query-class-testid-noi-bo-refactor-vo.tsx)

### 2. Quên `await userEvent` → flaky
> 📄 **Code ví dụ:** [`examples/13-2-quen-await-userevent-flaky.tsx`](examples/13-2-quen-await-userevent-flaky.tsx)
> 📄 **Code ví dụ:** [`examples/14-2-quen-await-userevent-flaky.tsx`](examples/14-2-quen-await-userevent-flaky.tsx)

### 3. Quên jest-dom setup → matcher không tồn tại
Mô tả: "toBeInTheDocument is not a function" — không phải logic sai mà setup thiếu. Fix: `setupFiles: ["./src/test-setup.ts"]` với `import "@testing-library/jest-dom"` 1 lần (xem mẫu trên).

### 4. Test implementation (state/call) → khó bảo trì
> 📄 **Code ví dụ:** [`examples/15-4-test-implementation-state-call-kho-bao-tri.tsx`](examples/15-4-test-implementation-state-call-kho-bao-tri.tsx)
> 📄 **Code ví dụ:** [`examples/16-4-test-implementation-state-call-kho-bao-tri.tsx`](examples/16-4-test-implementation-state-call-kho-bao-tri.tsx)

### 5. E2E `waitForTimeout` → chậm + flaky
> 📄 **Code ví dụ:** [`examples/17-5-e2e-waitfortimeout-cham-flaky.ts`](examples/17-5-e2e-waitfortimeout-cham-flaky.ts)
> 📄 **Code ví dụ:** [`examples/18-5-e2e-waitfortimeout-cham-flaky.ts`](examples/18-5-e2e-waitfortimeout-cham-flaky.ts)

### 6. Không reset mock/DOM → rò giữa test
Mô tả: mock đếm dồn, DOM test trước còn (2 nút "+1") → `getByRole` "found multiple". Fix: `beforeEach(vi.clearAllMocks())` + RTL auto-cleanup (globals) / `cleanup()` tay.

### 7. Warning `act(...)` (StrictMode/async) → bọc chưa đủ
Mô tả: `setState` sau `render` không trong `act` (fetch về sau test xong). Fix: `await userEvent`/`findBy`/`waitFor` (bọc act) thay vì `fireEvent` + assert sync. Không suppress warning.

### 8. Timeout thật cho debounce/interval → chậm/flaky
> 📄 **Code ví dụ:** [`examples/19-8-timeout-that-cho-debounce-interval-cham-flaky.tsx`](examples/19-8-timeout-that-cho-debounce-interval-cham-flaky.tsx)
> 📄 **Code ví dụ:** [`examples/20-8-timeout-that-cho-debounce-interval-cham-flaky.tsx`](examples/20-8-timeout-that-cho-debounce-interval-cham-flaky.tsx)

## Best practices / Mẹo
Mục này là "bộ luật dọn dẹp" sau khi biết viết test: chọn tầng nào, test cái gì, đặt tên ra sao để suite sống lâu không thành gánh nặng.
- **Kim tự tháp:** nhiều unit/integration (Vitest/RTL, ms) + ít E2E (Playwright, giây) cho luồng tiền. Vì sao? Vì E2E tin nhất nhưng chậm/đắt/flaky hơn — phủ hết bằng E2E là CI giờ đồng hồ.
- **Hành vi, không implementation:** câu test như user ("bấm +1 hai lần, thấy Count: 2"). Vì sao? Để refactor (đổi class/tên hàm/tách component) không vỡ khi hành vi giữ.
- Hook `renderHook` + hàm thuần test trực tiếp (không render UI). Vì sao? Vì logic hook/hàm độc lập — test UI cho nó là phí + mờ (fail không biết do logic hay UI).
- MSW thay mock fetch tay. Vì sao? Vì MSW giữ `ok`/parse/headers thật + tái dùng dev/browser (mock 1 chỗ).
- Playwright `storageState` login 1 lần + trace/video CI + matrix 3 browser cho luồng tiền. Vì sao? Vì login mỗi test chậm + phụ thuộc; trace cho xem lại fail như video.
- Query trong test: client mới + `retry: false`. Vì sao? Để nhanh (không chờ retry) + cô lập (không cache rò).
- **Tên test như câu chuyện** ("hiển thị lỗi khi email trống") — tài liệu sống. Vì sao? Vì đọc tên là biết hành vi hệ thống, không mở code.

> **Tóm gọn 1 câu:** Test tốt là test nói được thành câu user hiểu, chạy nhanh tầng dưới, và chỉ đổ thật sự khi hành vi đổi — không phải khi bạn đổi tên biến.

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
