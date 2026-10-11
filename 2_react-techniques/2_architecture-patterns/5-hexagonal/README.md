# Hexagonal / Ports & Adapters (React)

> Nguồn: https://alistair.cockburn.us/hexagonal-architecture/

## Mục tiêu

### 1. Tách core nghiệp vụ (use-case, entity) khỏi mọi thứ bên ngoài: React, fetch, localStorage, thư viện

**Vì sao:** nghiệp vụ (tính tiền, đếm todo mở, xét duyệt đơn) là thứ sống lâu nhất và đáng test nhất. Nhúng nó vào component (`fetch` + `useState` + luật lẫn lộn) khiến test phải mock fetch/server/browser, đổi API phải sửa view, tái dùng ở mobile/CLI phải mang theo React. Tách core thuần TS giúp test chạy tức thì (không jsdom, không network), đổi kênh không đụng luật.

**Cơ chế:** core chỉ chứa entity (Todo, Order) + use-case (hàm thuần nhận data, trả kết quả) + port (interface). Không `import` React, fetch, localStorage trong core. Mọi I/O là adapter ngoài (http, memory, localStorage) implement port và được bơm vào use-case qua tham số (DI thủ công).

```ts
// ✅ ĐÚNG: core thuần TS — không React, không fetch
export type Todo = { id: number; title: string; done: boolean }; // entity thuần
export const demMo = (todos: Todo[]) => todos.filter((t) => !t.done).length; // luật thuần, test không cần mock
```

**Sai thì sao:**

```ts
// ❌ SAI: luật lẫn fetch trong component — test phải mock fetch, đổi API sửa view
function DemMo() {
  const [n, setN] = useState(0);
  useEffect(() => { fetch('/api/todos').then((r) => r.json()).then((ts) => setN(ts.filter((t: any) => !t.done).length)); }, []);
  return <p>{n}</p>;
}
// ✅ ĐÚNG: use-case thuần + adapter bơm vào (xem Ví dụ chi tiết)
```

**Usecase thực tế:** app todo có 3 nguồn (REST production, memory demo, mock test) cùng nuôi một entity. Hoặc nghiệp vụ tính giá có 5 luật (giảm, thuế, ship) đáng test 50 case mà không cần browser. Quy tắc nhận diện "khi nào dùng": ≥ 3 use-case trên cùng entity, hoặc nhiều nguồn data (REST + WS + cache offline), hoặc cần test luật không phụ thuộc framework → hexagonal. CRUD trình diễn thuần (fetch → render) → fetch thẳng, đừng over-abstract.

### 2. Giao tiếp qua port (interface) + adapter (HTTP, mock, test) — đảo ngược phụ thuộc

**Vì sao:** không port, core `import` trực tiếp adapter (`import { httpRepo }`) — đổi adapter phải sửa core, test phải có server thật. Có port, core chỉ biết "tôi cần `list()`/`toggle(id)`", adapter nào implement đúng đều cắm được. Chiều phụ thuộc đảo: adapter import core (để biết interface), core không import adapter.

**Cơ chế:** `interface TodoRepository { list(): Promise<Todo[]>; toggle(id: number): Promise<void> }` là port. `httpTodoRepo` (fetch), `memoryTodoRepo` (mảng trong RAM), `localStorageTodoRepo` là adapter. Use-case `countOpenTodos(repo)` nhận repo qua tham số — production bơm http, demo/test bơm memory.

### 3. Test use-case bằng port giả mà không cần mock fetch/server; dễ thay nguồn dữ liệu

**Vì sao:** mock fetch (`vi.mock('fetch')`) giòn, phụ thuộc lib, chạy chậm. Port giả là object thường (`{ list: async () => [...] }`) — test chạy mili-giây, không network, không jsdom, đọc là hiểu.

```ts
// ✅ ĐÚNG: test không mock fetch — chỉ object literal implement port
import { describe, expect, it } from 'vitest';
const giaRepo = { list: async () => [{ id: 1, title: 'A', done: false }], toggle: async () => {} };
it('đếm đúng todo mở', async () => { expect(await countOpenTodos(giaRepo)()).toBe(1); });
```

## Tổng quan

Kiến trúc **Hexagonal** (Alistair Cockburn, gọi là Ports & Adapters) đặt nghiệp vụ ở **trung tâm (core)** và mọi thứ "bên ngoài" — database, HTTP API, UI framework, email, queue — trở thành **adapter** cắm vào qua **port** (interface). Internet ví von: core là "con người", các cổng là "ổ cắm", adapter là "phích cắm khác nhau" (cùng một ổ, thay phích là chuyển kênh mà không đụng con người).

Trong React: component/hook gọi use-case của core thay vì gọi `fetch` trực tiếp; API `fetch` là một adapter (có thể đổi qua `mockTodoRepo` khi test/demo). Với TanStack Query, hook query là **adapter UI** — `queryFn` gọi use-case đã bơm adapter dữ liệu (`queryFn: () => countOpenTodos(httpTodoRepo)()`), cache/mutation vẫn hoạt động bình thường.

Áp dụng khi: app có nghiệp vụ phức tạp đáng "đóng hộp" tách khỏi framework, muốn test logic không phụ thuộc browser, hoặc nhiều nguồn dữ liệu (REST, WS, mocks, cache offline) cùng nuôi một entity.

## Khái niệm cốt lõi

### 1. Entity — object nghiệp vụ thuần, không biết React

`Todo`, `Order` là type/interface TS thuần: field + (tùy chọn) hàm thuần tính dẫn xuất. Không `React.FC`, không JSX, không `fetch`. Giữ thuần để tái dùng ở web/mobile/CLI và test không cần jsdom.

### 2. Use-case — hành vi nghiệp vụ dùng entity + port, DI qua tham số

`countOpenTodos(repo)` nhận repository qua tham số (DI thủ công), trả hàm async đếm. Core không `import` fetch bao giờ — nó chỉ gọi `repo.list()` (interface). Currying `(repo) => () => ...` tạo "use-case đã nạp adapter" dùng ở nhiều hook.

```ts
// ✅ ĐÚNG: core chỉ biết interface — không biết fetch hay mock
export const countOpenTodos = (repo: TodoRepository) => async (): Promise<number> => {
  const todos = await repo.list(); // chỉ dùng port, không biết kênh nào
  return todos.filter((t) => !t.done).length; // luật thuần về entity
};
```

**Sai thì sao:**

```ts
// ❌ SAI: core import adapter — đảo ngược sai chiều, mất ý nghĩa tách
// core/usecase.ts
import { httpRepo } from '../adapters/http'; // core biết kênh cụ thể → đổi kênh phải sửa core
// ✅ ĐÚNG: nhận qua tham số — adapter import core, không ngược lại
export const countOpenTodos = (repo: TodoRepository) => async () => { /* ... */ };
```

### 3. Port — interface khai báo "core cần gì"

`TodoRepository { list(); toggle(id) }` là giao ước: core ép thế giới ngoài phải có hai hàm này. Port chỉ chứa nhu cầu của core (data + hành vi nghiệp vụ), không chứa hàm React (điều hướng, toast) — nhét UI vào port là port "quá khớp" adapter, mất ý nghĩa tách.

### 4. Adapter — cài đặt interface: http, memory, localStorage

Mỗi adapter implement đúng port. `httpTodoRepo` fetch `/api/todos`; `memoryTodoRepo` giữ mảng RAM; `localStorageTodoRepo` đọc/ghi storage. Đổi adapter = đổi kênh, core nằm yên. Luôn viết 2 adapter (real + mock) — demo/preview/test đều chạy được.

```ts
// ✅ ĐÚNG: adapter http — implement đúng port, core không hay biết
export const httpTodoRepo: TodoRepository = {
  async list() { const r = await fetch('/api/todos'); return r.json(); },
  async toggle(id: number) { await fetch(`/api/todos/${id}/toggle`, { method: 'POST' }); },
};
```

### 5. Dependency Inversion — core không import adapter

Chiều duy nhất: adapter → core. Vi phạm (core import adapter) là mất tách. Kiểm tra bằng mắt: mở file core, không thấy `import ... from '../adapters'` nào là đạt.

### 6. TanStack Query là adapter UI

`queryFn` không fetch thẳng mà gọi use-case đã bơm adapter. Cache/mutation/devtools của Query vẫn hoạt động — Query không biết (và không cần biết) data đến từ http hay memory.

```tsx
// ✅ ĐÚNG: Query là lớp UI, use-case là lớp luật, adapter là lớp kênh
useQuery({ queryKey: ['todos', 'open-count'], queryFn: () => countOpenTodos(httpTodoRepo)() });
```

## Luồng hoạt động / Cách áp dụng

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

## Ví dụ chi tiết

Mirror 1-1 với `example.tsx` cùng thư mục (không rút gọn):

```tsx
// ---- core (thuần TS, không phụ thuộc React) ----
// Vì sao thuần: test không cần jsdom/fetch, tái dùng ở mọi nền tảng
export type Todo = { id: number; title: string; done: boolean }; // entity — object nghiệp vụ thuần

// port: core "yêu cầu" thế giới bên ngoài cung cấp — interface, không cài đặt
// Vì sao interface: core chỉ biết "cần list/toggle", không biết http hay mock
export interface TodoRepository {
  list(): Promise<Todo[]>;
  toggle(id: number): Promise<void>;
}

// use-case: nghiệp vụ "đếm todo chưa xong" — nhận repo qua tham số (DI thủ công)
// Vì sao currying: countOpenTodos(repo) tạo "use-case đã nạp adapter" dùng ở nhiều hook
export const countOpenTodos =
  (repo: TodoRepository) => async (): Promise<number> => {
    const todos = await repo.list(); // chỉ dùng interface, không biết là fetch/mock
    return todos.filter((t) => !t.done).length; // luật thuần về entity — dễ test
  };

// ---- adapter mock (dùng cho demo/test) ----
// memoryTodoRepo implement đúng TodoRepository — đổi nguồn không đụng core
// Vì sao 2 adapter: demo/preview/test chạy được không cần server
export const memoryTodoRepo: TodoRepository & { data: Todo[] } = {
  data: [
    { id: 1, title: 'Học hooks', done: true },
    { id: 2, title: 'Học hexagonal', done: false },
  ],
  async list() {
    return this.data; // giả lập đọc — adapter thật sẽ fetch /api/todos
  },
  async toggle(id: number) {
    const t = this.data.find((x) => x.id === id);
    if (t) t.done = !t.done; // cập nhật "database" giả — giữ hành vi giống kênh thật
  },
};

// ---- React: gọi use-case qua adapter ----
import { useEffect, useState } from 'react';

export function OpenTodoCount() {
  const [open, setOpen] = useState<number | null>(null); // kết quả use-case — null là "chưa về"
  useEffect(() => {
    // bơm memoryTodoRepo — production thay bằng httpTodoRepo, không sửa core/use-case
    countOpenTodos(memoryTodoRepo)().then(setOpen);
  }, []);
  return <p>Todo chưa xong: {open ?? '…'}</p>;
}
```

Adapter thật đi kèm (pattern chuẩn):

```ts
// httpTodoRepo — adapter production (file cần thêm: adapters/httpTodoRepo.ts)
export const httpTodoRepo: TodoRepository = {
  async list() {
    const r = await fetch('/api/todos'); // kênh thật — core không biết dòng này tồn tại
    if (!r.ok) throw new Error('Tải todos lỗi');
    return r.json();
  },
  async toggle(id: number) {
    await fetch(`/api/todos/${id}/toggle`, { method: 'POST' });
  },
};
```

## Giải thích từng phần

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

### Hexagonal vs MVVM (bài 3 nhóm 2)

MVVM tách trách nhiệm trong UI (view/viewmodel); hexagonal tách miền nghiệp vụ khỏi môi trường (core/ports/adapters). Bổ trợ nhau: viewmodel gọi use-case, use-case dùng port. Dùng MVVM khi UI phức tạp, hexagonal khi luật phức tạp — app lớn dùng cả hai.

### Hexagonal vs feature-sliced

FSD trả lời "file đặt ở đâu"; hexagonal trả lời "phụ thuộc đi chiều nào". Áp cả hai: mỗi feature slice có core + adapter riêng trong slice của nó (`features/x/model` là use-case, `features/x/api` là adapter).

### Core + DI vs fetch trực tiếp

Trực tiếp nhanh viết (1 file) nhưng mỗi chỗ đeo một kênh, test cần network. Core + DI thêm 2–3 file nhưng test tức thì, đổi API không chạm view. Ngưỡng: ≥ 3 use-case trên cùng entity hoặc nhiều nguồn thì tách; một hàm fetch duy nhất thì fetch thẳng.

## Lỗi thường gặp / Chống chỉ định

### 1. Core import adapter → mất đảo chiều

```ts
// ❌ SAI: core biết kênh cụ thể
import { httpRepo } from '../adapters/http';
export const dem = () => httpRepo.list();
// ✅ ĐÚNG: nhận qua tham số
export const dem = (repo: TodoRepository) => () => repo.list();
```

### 2. Port quá khớp adapter (chứa hàm React) → mất tách

Port chỉ data + hành vi nghiệp vụ. Điều hướng/toast là việc UI, không phải core. Đẩy chúng ra hook ngoài, use-case chỉ trả kết quả thuần.

### 3. Over-abstraction: port cho một hàm fetch duy nhất

4 file để chạy `getUser` là phí. Hexagonal cho vùng nghiệp vụ thật; chỗ đơn giản fetch thẳng.

### 4. Adapter rò state (mock dễ dãi hơn thật) → core kỳ vọng sai

Mock phải copy/validate như thật. `list()` trả reference nội bộ để test sửa trực tiếp là rò — trả copy (`[...this.data]`) để giống fetch (luôn data mới).

### 5. Chống chỉ định: CRUD trình diễn thuần

Fetch → render không luật → hexagonal chỉ thêm cầu kỳ. Bắt đầu khi luật đáng test hoặc nhiều nguồn cùng nuôi một entity.

## Câu hỏi thường gặp

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

- **Hexagonal + FSD:** core ≈ `entities`/`shared/model`, adapter ≈ `shared/api`, UI hook ở `features`. Mỗi slice là một hexagon nhỏ.
- **TanStack Query là adapter UI hoàn hảo:** `queryFn` bơm adapter dữ liệu; cache/mutation hoạt động, core vẫn thuần.
- **Monorepo:** core thành package riêng không phụ thuộc React — tái dùng web/mobile/CLI, test một lần.

## Best practices / Mẹo

### Folder chuẩn + 2 adapter + test literal + Query bọc ngoài

`entities/todo/{types,api,model}`; mỗi port 2 adapter (real + mock); test bằng literal không lib mock; Query `queryFn` là "bơm adapter vào use-case". Viết port trước, adapter sau. Test cạnh core, không jsdom. Không leak type framework vào core. Không adapter gọi adapter — luôn core → một adapter.

## Bài tập nhỏ

1. Thêm use-case `completeAllOpen(repo)` (đánh dấu xong mọi todo mở) trong core — thuần TS, nhận repo qua tham số.
2. Viết `httpTodoRepo` (fetch `/api/todos`) implement đúng port.
3. Viết unit test cho `completeAllOpen` với port giả literal (không mock fetch): case rỗng, case nửa xong, case xong hết.
4. Dùng `useQuery` bơm `httpTodoRepo` cho `OpenTodoCount` — comment từng dòng đâu là core/port/adapter/UI. Chạy test xác nhận không cần server.

## Reference

- [Hexagonal Architecture (Cockburn)](https://alistair.cockburn.us/hexagonal-architecture/)
- [Ports & Adapters (Wikipedia)](https://en.wikipedia.org/wiki/Hexagonal_architecture_(software))
