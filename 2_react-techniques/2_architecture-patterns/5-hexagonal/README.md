# Hexagonal / Ports & Adapters (React)

> Nguồn: https://alistair.cockburn.us/hexagonal-architecture/

## Mục tiêu

Mục này nói về ba đích của bài: tách core nghiệp vụ khỏi framework, giao tiếp qua port/adapter, và test logic không cần mock fetch. Đọc để thấy bài giải bài toán "nghiệp vụ dính chặt React" thế nào.

### 1. Tách core nghiệp vụ (use-case, entity) khỏi mọi thứ bên ngoài: React, fetch, localStorage, thư viện

**Vì sao:** nghiệp vụ (tính tiền, đếm todo mở, xét duyệt đơn) là thứ sống lâu nhất và đáng test nhất. Nhúng nó vào component (`fetch` + `useState` + luật lẫn lộn) khiến test phải mock fetch/server/browser, đổi API phải sửa view, tái dùng ở mobile/CLI phải mang theo React. Tách core thuần TS giúp test chạy tức thì (không jsdom, không network), đổi kênh không đụng luật.

**Cơ chế:** core chỉ chứa entity (Todo, Order) + use-case (hàm thuần nhận data, trả kết quả) + port (interface). Không `import` React, fetch, localStorage trong core. Mọi I/O là adapter ngoài (http, memory, localStorage) implement port và được bơm vào use-case qua tham số (DI thủ công).

> 📄 **Code ví dụ:** [`examples/01-1-tach-core-nghiep-vu-use-case-entity.ts`](examples/01-1-tach-core-nghiep-vu-use-case-entity.ts)

**Sai thì sao:**

> 📄 **Code ví dụ:** [`examples/02-1-tach-core-nghiep-vu-use-case-entity.ts`](examples/02-1-tach-core-nghiep-vu-use-case-entity.ts)

> **Tóm gọn 1 câu:** Core nghiệp vụ là "cục pin rời" — không biết React là gì, cắm vào web, mobile hay CLI đều chạy.

**Usecase thực tế:** app todo có 3 nguồn (REST production, memory demo, mock test) cùng nuôi một entity. Hoặc nghiệp vụ tính giá có 5 luật (giảm, thuế, ship) đáng test 50 case mà không cần browser. Quy tắc nhận diện "khi nào dùng": ≥ 3 use-case trên cùng entity, hoặc nhiều nguồn data (REST + WS + cache offline), hoặc cần test luật không phụ thuộc framework → hexagonal. CRUD trình diễn thuần (fetch → render) → fetch thẳng, đừng over-abstract.

### 2. Giao tiếp qua port (interface) + adapter (HTTP, mock, test) — đảo ngược phụ thuộc

**Vì sao:** không port, core `import` trực tiếp adapter (`import { httpRepo }`) — đổi adapter phải sửa core, test phải có server thật. Có port, core chỉ biết "tôi cần `list()`/`toggle(id)`", adapter nào implement đúng đều cắm được. Chiều phụ thuộc đảo: adapter import core (để biết interface), core không import adapter.

**Cơ chế:** `interface TodoRepository { list(): Promise<Todo[]>; toggle(id: number): Promise<void> }` là port. `httpTodoRepo` (fetch), `memoryTodoRepo` (mảng trong RAM), `localStorageTodoRepo` là adapter. Use-case `countOpenTodos(repo)` nhận repo qua tham số — production bơm http, demo/test bơm memory.

### 3. Test use-case bằng port giả mà không cần mock fetch/server; dễ thay nguồn dữ liệu

**Vì sao:** mock fetch (`vi.mock('fetch')`) giòn, phụ thuộc lib, chạy chậm. Port giả là object thường (`{ list: async () => [...] }`) — test chạy mili-giây, không network, không jsdom, đọc là hiểu.

> 📄 **Code ví dụ:** [`examples/03-3-test-use-case-bang-port-gia-ma.ts`](examples/03-3-test-use-case-bang-port-gia-ma.ts)

> **Tóm gọn 1 câu:** Port là ổ cắm chuẩn, adapter là phích cắm, test dùng phích giả — test mili-giây vì không cần đợi ai cả.

## Tổng quan

Mục này nói về tư tưởng trung tâm của hexagonal: nghiệp vụ ở giữa, thế giới ngoài cắm vào qua cổng. Đọc để hình dung toàn bộ mô hình trước khi đi vào từng khái niệm.

Kiến trúc **Hexagonal** (Alistair Cockburn, gọi là Ports & Adapters) đặt nghiệp vụ ở **trung tâm (core)** và mọi thứ "bên ngoài" — database, HTTP API, UI framework, email, queue — trở thành **adapter** cắm vào qua **port** (interface). Internet ví von: core là "con người", các cổng là "ổ cắm", adapter là "phích cắm khác nhau" (cùng một ổ, thay phích là chuyển kênh mà không đụng con người).

Trong React: component/hook gọi use-case của core thay vì gọi `fetch` trực tiếp; API `fetch` là một adapter (có thể đổi qua `mockTodoRepo` khi test/demo). Với TanStack Query, hook query là **adapter UI** — `queryFn` gọi use-case đã bơm adapter dữ liệu (`queryFn: () => countOpenTodos(httpTodoRepo)()`), cache/mutation vẫn hoạt động bình thường.

Áp dụng khi: app có nghiệp vụ phức tạp đáng "đóng hộp" tách khỏi framework, muốn test logic không phụ thuộc browser, hoặc nhiều nguồn dữ liệu (REST, WS, mocks, cache offline) cùng nuôi một entity.

> **Tóm gọn 1 câu:** Hexagonal đặt nghiệp vụ vào trung tâm bất khả xâm phạm, mọi I/O là phích cắm qua ổ chuẩn (port) — đổi phích không đụng máy.

## Khái niệm cốt lõi

Mục này nói về 6 khái niệm cấu thành hexagonal: entity, use-case, port, adapter, dependency inversion, và vị trí của TanStack Query. Đọc để nắm từng mảnh của mô hình.

### 1. Entity — object nghiệp vụ thuần, không biết React

`Todo`, `Order` là type/interface TS thuần: field + (tùy chọn) hàm thuần tính dẫn xuất. Không `React.FC`, không JSX, không `fetch`. Giữ thuần để tái dùng ở web/mobile/CLI và test không cần jsdom.

### 2. Use-case — hành vi nghiệp vụ dùng entity + port, DI qua tham số

`countOpenTodos(repo)` nhận repository qua tham số (DI thủ công), trả hàm async đếm. Core không `import` fetch bao giờ — nó chỉ gọi `repo.list()` (interface). Currying `(repo) => () => ...` tạo "use-case đã nạp adapter" dùng ở nhiều hook.

> 📄 **Code ví dụ:** [`examples/04-2-use-case-hanh-vi-nghiep-vu-dung.ts`](examples/04-2-use-case-hanh-vi-nghiep-vu-dung.ts)

**Sai thì sao:**

> 📄 **Code ví dụ:** [`examples/05-2-use-case-hanh-vi-nghiep-vu-dung.ts`](examples/05-2-use-case-hanh-vi-nghiep-vu-dung.ts)

### 3. Port — interface khai báo "core cần gì"

`TodoRepository { list(); toggle(id) }` là giao ước: core ép thế giới ngoài phải có hai hàm này. Ví von: port như bản hợp đồng thuê — chủ nhà (core) chỉ ghi "cần ai giao nước và rác đúng giờ", còn ai đáp ứng (http, memory) thì hợp tác. Port chỉ chứa nhu cầu của core (data + hành vi nghiệp vụ), không chứa hàm React (điều hướng, toast) — nhét UI vào port là port "quá khớp" adapter, mất ý nghĩa tách.

### 4. Adapter — cài đặt interface: http, memory, localStorage

Mỗi adapter implement đúng port. `httpTodoRepo` fetch `/api/todos`; `memoryTodoRepo` giữ mảng RAM; `localStorageTodoRepo` đọc/ghi storage. Đổi adapter = đổi kênh, core nằm yên. Luôn viết 2 adapter (real + mock) — demo/preview/test đều chạy được.

> 📄 **Code ví dụ:** [`examples/06-4-adapter-cai-at-interface-http-memory-localstorage.ts`](examples/06-4-adapter-cai-at-interface-http-memory-localstorage.ts)

### 5. Dependency Inversion — core không import adapter

Chiều duy nhất: adapter → core. Vi phạm (core import adapter) là mất tách. Kiểm tra bằng mắt: mở file core, không thấy `import ... from '../adapters'` nào là đạt.

### 6. TanStack Query là adapter UI

`queryFn` không fetch thẳng mà gọi use-case đã bơm adapter. Cache/mutation/devtools của Query vẫn hoạt động — Query không biết (và không cần biết) data đến từ http hay memory.

> 📄 **Code ví dụ:** [`examples/07-6-tanstack-query-la-adapter-ui.tsx`](examples/07-6-tanstack-query-la-adapter-ui.tsx)

> **Tóm gọn 1 câu:** Entity thuần, use-case DI qua tham số, port là giao ước, adapter là phích cắm — và chiều phụ thuộc chỉ một: adapter → core.

## Luồng hoạt động / Cách áp dụng

Mục này nói về 5 bước dựng hexagonal cho một vùng nghiệp vụ. Đọc để có trình tự: kẻ ranh giới → viết core → viết adapter → bơm → test.

### Bước 1. Kẻ ranh giới: thuần nghiệp vụ → core; I/O → adapter

Tính toán, luật, validate thuần → core. Fetch, storage, router, toast, clock → adapter/ngoài. Viết port trước (giao ước), adapter sau (cài đặt).

### Bước 2. Viết entity + use-case thuần TS trong `core/`, khai báo port

Không React types trong core (`React.FC`, `JSX` là phạm luật). Mỗi use-case một hàm rõ tên (`completeAllOpen`, `countOpenTodos`).

### Bước 3. Viết 2 adapter: thật (http) + mock (memory)

Mock vừa demo vừa test. Adapter giữ hành vi giống kênh thật (copy, validate) — đừng để mock "dễ dãi" hơn thật rồi core kỳ vọng sai.

### Bước 4. Hook/component gọi use-case, bơm adapter phù hợp

Production → http (+ cache Query); demo/preview → memory; test → object literal. Không có `if (env === 'test')` trong core — quyết định bơm ở ngoài.

### Bước 5. Test use-case bằng port giả trực tiếp, không mock-fetch

Mỗi luật 5–10 case với data literal. Chạy mili-giây, đặt cạnh core (không cần jsdom). Đây là lợi ích lớn nhất của hexagonal — test nhanh nhất và ổn định nhất.

> **Tóm gọn 1 câu:** Kẻ ranh giới trước, port trước adapter sau, luôn có 2 adapter, và test bằng object literal là phần thưởng lớn nhất của kiến trúc này.

## Ví dụ chi tiết

Mục này nói về code hoàn chỉnh mirror 1-1 với file gốc. Đọc để thấy core/port/adapter/UI cùng sống trong một dự án thật.

Mirror 1-1 với `example.tsx` cùng thư mục (không rút gọn):

> 📄 **Code ví dụ:** [`examples/08-vi-du-chi-tiet.tsx`](examples/08-vi-du-chi-tiet.tsx)

Adapter thật đi kèm (pattern chuẩn):

> 📄 **Code ví dụ:** [`examples/09-vi-du-chi-tiet.ts`](examples/09-vi-du-chi-tiet.ts)

## Giải thích từng phần

Mục này nói về từng mảnh trong ví dụ — đặc biệt là currying kiểu DI và cách mock "trung thực" như kênh thật.

### `countOpenTodos(repo)(…)` — currying kiểu DI

Hàm ngoài nhận port, trả use-case đã nạp. Gọi `countOpenTodos(httpRepo)` một lần ở hook, dùng nhiều lần. Không currying mà truyền repo mỗi lần gọi cũng được, nhưng currying giúp hook gọn và rõ "adapter nào đang dùng".

### `TodoRepository` — giao ước, không cài đặt

React/fetch/localStorage không xuất hiện trong core. Core "ép" adapter phải có `list`/`toggle` — adapter nào thiếu là lỗi type ngay lúc build, không đợi runtime.

### `memoryTodoRepo` — vừa demo vừa test, không `vi.mock('fetch')`

Object thường trả data ổn định. Test import nó (hoặc literal nhỏ hơn) là chạy — không lib mock, không server, không flaky.

### `useEffect` + `setOpen` — demo tối giản; app thật bọc Query

Demo dùng effect cho gọn. App thật: `useQuery({ queryFn: () => countOpenTodos(httpTodoRepo)() })` — Query là adapter UI, core vẫn thuần.

### Vị trí file thật — core ~ entities/shared, adapter ~ shared/api (kết hợp FSD)

Demo một file cho gọn; dự án thật tách `entities/todo/{types,api,model}`: types (entity+port), api (http adapter), model (use-case). Mock/test cạnh đó.

## So sánh (nếu có)

Mục này nói về ba cặp so sánh: hexagonal vs MVVM, hexagonal vs FSD, core+DI vs fetch thẳng. Đọc để biết đặt hexagonal vào đâu trong bộ công cụ kiến trúc.

### Hexagonal vs MVVM (bài 3 nhóm 2)

MVVM tách trách nhiệm trong UI (view/viewmodel); hexagonal tách miền nghiệp vụ khỏi môi trường (core/ports/adapters). Bổ trợ nhau: viewmodel gọi use-case, use-case dùng port. Dùng MVVM khi UI phức tạp, hexagonal khi luật phức tạp — app lớn dùng cả hai.

### Hexagonal vs feature-sliced

FSD trả lời "file đặt ở đâu"; hexagonal trả lời "phụ thuộc đi chiều nào". Áp cả hai: mỗi feature slice có core + adapter riêng trong slice của nó (`features/x/model` là use-case, `features/x/api` là adapter).

### Core + DI vs fetch trực tiếp

Trực tiếp nhanh viết (1 file) nhưng mỗi chỗ đeo một kênh, test cần network. Core + DI thêm 2–3 file nhưng test tức thì, đổi API không chạm view. Ngưỡng: ≥ 3 use-case trên cùng entity hoặc nhiều nguồn thì tách; một hàm fetch duy nhất thì fetch thẳng.

> **Tóm gọn 1 câu:** Hexagonal bổ trợ (không thay) MVVM và FSD — MVVM tách UI, FSD xếp file, hexagonal kiểm soát chiều phụ thuộc của nghiệp vụ.

## Lỗi thường gặp / Chống chỉ định

Mục này nói về 5 bẫy của hexagonal — từ mất đảo chiều đến over-abstraction. Đọc để kiến trúc không biến thành ceremony vô nghĩa.

### 1. Core import adapter → mất đảo chiều

> 📄 **Code ví dụ:** [`examples/10-1-core-import-adapter-mat-ao-chieu.ts`](examples/10-1-core-import-adapter-mat-ao-chieu.ts)

### 2. Port quá khớp adapter (chứa hàm React) → mất tách

Port chỉ data + hành vi nghiệp vụ. Điều hướng/toast là việc UI, không phải core. Đẩy chúng ra hook ngoài, use-case chỉ trả kết quả thuần.

### 3. Over-abstraction: port cho một hàm fetch duy nhất

4 file để chạy `getUser` là phí. Hexagonal cho vùng nghiệp vụ thật; chỗ đơn giản fetch thẳng.

### 4. Adapter rò state (mock dễ dãi hơn thật) → core kỳ vọng sai

Mock phải copy/validate như thật. `list()` trả reference nội bộ để test sửa trực tiếp là rò — trả copy (`[...this.data]`) để giống fetch (luôn data mới).

### 5. Chống chỉ định: CRUD trình diễn thuần

Fetch → render không luật → hexagonal chỉ thêm cầu kỳ. Bắt đầu khi luật đáng test hoặc nhiều nguồn cùng nuôi một entity.

> **Tóm gọn 1 câu:** Không cho core import adapter, không nhét UI vào port, không port hóa một hàm fetch — và CRUD trình diễn thì đừng làm hexagonal.

## Câu hỏi thường gặp

Mục này nói về các câu hỏi ranh giới hay đắn nhất khi áp hexagonal — tra nhanh khi phân vân.

### Overkill cho CRUD không?

Có với CRUD thuần. Chỉ áp khi nghiệp vụ đáng test, nhiều nguồn, hoặc cần tách khỏi framework. Một bảng hiển thị đơn giản không cần port/adapter.

### DI thủ công khác DI container?

React thường không cần container — truyền port qua tham số/context đủ. Container (tsyringe) hợp backend/CLI có graph phụ thuộc lớn.

### Core được import React types không?

Không. Chạm `React.FC`/`JSX` là phụ thuộc framework. Giữ TS thuần; React chỉ ở hook/adapter ngoài.

### Test không cần fetch thế nào?

Object literal implement port. Core chỉ biết interface nên test tức thì — đây là toàn bộ ý nghĩa của port.

### Adapter đặt ở đâu?

`shared/api` hoặc `entities/x/api`; core/port cạnh entity để self-contained. Kết hợp FSD: `entities/todo/{types,api,model}`.

## Ghi chú 2026

Mục này nói về những cách kết hợp hiện đại (FSD, TanStack Query, monorepo) — đọc để thấy hexagonal trong bối cảnh 2026.

- **Hexagonal + FSD:** core ≈ `entities`/`shared/model`, adapter ≈ `shared/api`, UI hook ở `features`. Mỗi slice là một hexagon nhỏ.
- **TanStack Query là adapter UI hoàn hảo:** `queryFn` bơm adapter dữ liệu; cache/mutation hoạt động, core vẫn thuần.
- **Monorepo:** core thành package riêng không phụ thuộc React — tái dùng web/mobile/CLI, test một lần.

## Best practices / Mẹo

### Folder chuẩn + 2 adapter + test literal + Query bọc ngoài

`entities/todo/{types,api,model}`; mỗi port 2 adapter (real + mock); test bằng literal không lib mock; Query `queryFn` là "bơm adapter vào use-case". Viết port trước, adapter sau. Test cạnh core, không jsdom. Không leak type framework vào core. Không adapter gọi adapter — luôn core → một adapter.

> **Tóm gọn 1 câu:** Port trước adapter sau, mỗi port hai phích cắm, test literal cạnh core — bộ mẹo này giữ hexagonal thực dụng chứ không ceremony.

## Bài tập nhỏ

Mục này nói về bài thực hành thêm một use-case mới kèm test và cắm vào UI — làm một lần để cả vòng đời hexagonal "chắc tay".

1. Thêm use-case `completeAllOpen(repo)` (đánh dấu xong mọi todo mở) trong core — thuần TS, nhận repo qua tham số.
2. Viết `httpTodoRepo` (fetch `/api/todos`) implement đúng port.
3. Viết unit test cho `completeAllOpen` với port giả literal (không mock fetch): case rỗng, case nửa xong, case xong hết.
4. Dùng `useQuery` bơm `httpTodoRepo` cho `OpenTodoCount` — comment từng dòng đâu là core/port/adapter/UI. Chạy test xác nhận không cần server.

> **Tóm gọn 1 câu:** Xong bài tập là bạn tự tay đi hết vòng: core → port → adapter → hook → test không cần server.

## Reference

- [Hexagonal Architecture (Cockburn)](https://alistair.cockburn.us/hexagonal-architecture/)
- [Ports & Adapters (Wikipedia)](https://en.wikipedia.org/wiki/Hexagonal_architecture_(software))
