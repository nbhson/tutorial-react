# Hexagonal / Ports & Adapters (React)

> Nguồn: https://alistair.cockburn.us/hexagonal-architecture/

## Mục tiêu
- Tách **core nghiệp vụ** (use-case, entity) khỏi mọi thứ bên ngoài: React, fetch, localStorage, thư viện.
- Giao tiếp qua **port** (interface) + **adapter** (cài đặt cụ thể: HTTP, mock, test) — đảo ngược phụ thuộc.
- Test use-case bằng port giả mà không cần mock fetch/server; dễ thay nguồn dữ liệu.

## Tổng quan
Kiến trúc **Hexagonal** (Alistair Cockburn, gọi là Ports & Adapters) đặt nghiệp vụ ở **trung tâm (core)** và mọi thứ "bên ngoài" — database, HTTP API, UI framework, email, queue — trở thành **adapter** cắm vào qua **port** (interface). Internet ví von: core là "con người", các cổng là "ổ cắm", adapter là "phích cắm khác nhau" (cùng một ổ, thay phích là chuyển kênh mà không đụng con người). Trong React: component/hook gọi use-case của core thay vì gọi `fetch` trực tiếp; API `fetch` là một adapter (có thể đổi qua `mockTodoRepo` khi test/demo). Áp dụng khi: app có nghiệp vụ phức tạp đáng "đóng hộp" tách khỏi framework, muốn test logic không phụ thuộc browser, hoặc nhiều nguồn dữ liệu (REST, WS, mocks, cache).

## Khái niệm cốt lõi
- **Entity**: object nghiệp vụ thuần (Todo, Order) không biết React.
- **Use-case**: hành vi nghiệp vụ dùng entity + port. Ví dụ `countOpenTodos(repo)` — nhận repository qua tham số (gọi là **DI thủ công** / dependency injection by parameter), core không `import` fetch bao giờ.
- **Port**: interface khai báo "core cần gì" — `TodoRepository { list(); toggle(id) }`. Core chỉ biết interface, không biết HTTP hay localStorage.
- **Adapter**: cài đặt interface — `httpTodoRepo` (fetch), `memoryTodoRepo` (mock), `localStorageTodoRepo`. Đổi adapter = đổi kênh, core nằm yên.
- **Dependency Inversion**: trong hexagonal, *core không import adapter* — adapter import core. Đây là chiều "đảo" duy nhất mà mọi kiến trúc tốt đều tuân theo.
- Với TanStack Query: hook query là **adapter UI** — `queryFn` gọi use-case đã bơm adapter dữ liệu. React DevTools xem cache vẫn bình thường.

## Luồng hoạt động / Cách áp dụng
1. Xác định ranh giới: cái gì thuần nghiệp vụ (tính toán, luật) → core; cái gì I/O (fetch, storage) → adapter.
2. Viết entity + use-case thuần TS trong `core/`, khai báo port interface.
3. Viết ít nhất 2 adapter: thật (http) + mock (memory) — mock vừa chạy demo vừa dùng test.
4. Hook/component gọi use-case, bơm adapter phù hợp (production → cache+http, test → memory).
5. Test use-case: tạo port giả trực tiếp (object thường), không cần mock-fetch library.

## Ví dụ chi tiết
```tsx
// ---- core (thuần TS, không phụ thuộc React) ----
export type Todo = { id: number; title: string; done: boolean }; // entity

// port: core "yêu cầu" thế giới bên ngoài cung cấp
export interface TodoRepository {
  list(): Promise<Todo[]>;
  toggle(id: number): Promise<void>;
}

// use-case: nghiệp vụ "đếm todo chưa xong" — nhận repo qua tham số (DI)
export const countOpenTodos =
  (repo: TodoRepository) => async (): Promise<number> => {
    const todos = await repo.list();          // chỉ dùng interface, không biết là fetch/mock
    return todos.filter((t) => !t.done).length; // luật thuần về entity
  };

// ---- adapter mock (dùng cho demo/test) ----
// memoryTodoRepo implement đúng TodoRepository — đổi nguồn không đụng core
export const memoryTodoRepo: TodoRepository & { data: Todo[] } = {
  data: [
    { id: 1, title: 'Học hooks', done: true },
    { id: 2, title: 'Học hexagonal', done: false },
  ],
  async list() {
    return this.data;     // trả về copy/như thật — ở đây giả lập lệnh đọc
  },
  async toggle(id: number) {
    const t = this.data.find((x) => x.id === id);
    if (t) t.done = !t.done; // cập nhật state trong "database" giả
  },
};

// ---- React: gọi use-case qua adapter ----
import { useEffect, useState } from 'react';

export function OpenTodoCount() {
  const [open, setOpen] = useState<number | null>(null); // kết quả use-case
  useEffect(() => {
    // bơm memoryTodoRepo — production thay bằng httpTodoRepo
    countOpenTodos(memoryTodoRepo)().then(setOpen);
  }, []);
  return <p>Todo chưa xong: {open ?? '…'}</p>;
}
```

## Giải thích từng phần
- `countOpenTodos(repo)(id)` — **currying kiểu DI**: hàm bên ngoài nhận port, trả use-case; gọi `countOpenTodos(repo)` tạo "use-case đã nạp adapter" dùng được nhiều nơi/khai báo ở hook.
- `TodoRepository` là *giao ước*: React, fetch, localStorage đều không được nhắc trong core — phía core chỉ "ép" adapter phải có `list`/`toggle`.
- `memoryTodoRepo` vừa là mock demo vừa đứng được trong unit test: không cần `vi.mock('fetch')`, chỉ cần object function trả dữ liệu ổn định.
- Vòng `useEffect` + `setOpen` đơn giản; với app thật, gói vào `useQuery({ queryFn: () => countOpenTodos(httpTodoRepo)() })` — queryFn của Query chỉ là nơi "gọi use-case đã có adapter".
- Tách rõ: file demo `example.tsx` minh họa luồng; trong dự án thật, core/adapter/hooks nằm theo thư mục (xem bài FSD: core ~ `entities`/`shared`, adapter ~ `shared/api`).

## So sánh (nếu có)
- **Hexagonal vs MVVM (bài 3)**: MVVM tách *trách nhiệm trong UI* (view/viewmodel); hexagonal tách *miền nghiệp vụ khỏi môi trường* (core/ports/adapters). Hai kiến trúc bổ trợ: viewmodel gọi use-case, use-case dùng port.
- **Hexagonal vs feature-sliced (bài 1)**: FSD tổ chức theo feature; hexagonal tổ chức theo *biên giới phụ thuộc*. FSD "nơi đặt file", hexagonal "chiều phụ thuộc" — áp cả hai: each feature có core + adapter riêng trong slice của nó.
- **Core thuần + DI thủ công vs gọi fetch trực tiếp**: trực tiếp nhanh viết nhưng mỗi chỗ "đeo" một kênh; core + DI làm thêm 2–3 file nhưng test không cần network, đổi API không chạm view. Chọn công cụ theo mức độ dự án.

## Lỗi thường gặp / Chống chỉ định
- **Core `import` adapter** (ví dụ `import { httpRepo } from '../adapters'` trong use-case) → đảo lại phụ thuộc, mất ý nghĩa. Fix: core chỉ nhận qua tham số; adapter import core (chiều chuẩn).
- **Port trùng lặp "quá khớp" adapter** (interface chứa luôn cả hàm điều hướng React) → mất ý nghĩa tách. Fix: port chỉ chứa nhu cầu *của core* (data & hành vi nghiệp vụ).
- **Over-abstraction: tạo port cho một hàm fetch duy nhất** → thêm 4 file để chạy "getUser". Fix: hexagonal cho vùng nghiệp vụ thật (≥ 3 use-case trên cùng entity), chỗ đơn giản cứ fetch thẳng.
- **Adapter "rò" state nghiệp vụ** (memoryTodoRepo sửa `this.data` vô điều kiện mà core không biết) → kỳ vọng ở core sai lệch. Fix: adapter giữ hành vi giống "kênh thật" (copy, validate), core là nơi duy nhất đưa luật.
- **Chống chỉ định**: app chủ yếu CRUD trình diễn (fetch → render) — hexagonal chỉ thêm cầu kỳ; nên bắt đầu khi luật nghiệp vụ đáng test, hoặc khi nhiều nguồn data (REST + WebSocket + cache offline) cùng nuôi một entity.

## Câu hỏi thường gặp
- **Hexagonal có overkill cho app CRUD không?** Với CRUD thuần đơn giản, có. Chỉ áp khi nghiệp vụ đáng test, nhiều nguồn dữ liệu, hoặc cần tách khỏi framework.
- **DI thủ công khác DI container thế nào?** Ở React thường không cần container — truyền port qua tham số/context là đủ; DI container (tsyringe, inversify) hữu ích ở backend/CLI hơn.
- **Core có được import React types không?** Nếu chạm `React.FC`, `JSX` thì core đã phụ thuộc framework; giữ core là TS thuần, React chỉ ở hook/adapter.
- **Làm sao test use-case không cần fetch?** Tạo object literal implement port (`{ list: async () => [...] }`); core chỉ biết interface nên test chạy tức thì.
- **Adapter đặt ở đâu?** `shared/api` hoặc trong entity slice (`entities/x/api`); core/port đặt cạnh entity để self-contained.

## Ghi chú 2026
- Kết hợp hexagonal với FSD: core ≈ `entities`/`shared/model`, adapter ≈ `shared/api`, UI hook ở `features`.
- TanStack Query là "adapter UI" hoàn hảo: `queryFn` gọi use-case đã bơm adapter dữ liệu; cache/mutation vẫn hoạt động.
- Với monorepo, đặt core thành package riêng không phụ thuộc React để tái dùng (web, mobile, CLI).

## Best practices / Mẹo
- Chuẩn folder (nếu dùng FSD): `entities/todo/{types,api,model}` — entity + port + adapter `http` trong đó; mock/test bơm qua file test.
- Luôn viết **2 adapter cho mỗi port** (real + mock/fake) — demo, preview, và test đều chạy được.
- Test use-case bằng object literal: `const repo = { list: async () => [...], toggle: async () => {} }` — không cần thư viện mock.
- Kết hợp với TanStack Query: `queryFn` = "bơm adapter vào use-case"; mutation tương tự `useMutation`. Core vẫn 100% thuần TS.
- Kẻ ranh giới trước khi viết code: viết port trước, adapter sau — "giao ước trước, cài đặt sau".
- Đặt test cho use-case cạnh core (không cần jsdom) — chạy nhanh nhất và ổn định nhất.
- Tránh leak type framework vào core: core chỉ export type thuần TS.
- Đặt use-case trong `model/` của entity, adapter HTTP trong `api/` — cùng một slice.
- Tránh adapter gọi adapter; luồng luôn là core → port → một adapter duy nhất.

## Bài tập nhỏ
Mở rộng ví dụ: thêm use-case `completeAllOpen(repo)` (đánh dấu xong toàn bộ todo chưa xong) trong core. Viết adapter thứ hai `httpTodoRepo` (fetch /api/todos). Viết unit test cho `completeAllOpen` với port giả (không mock fetch, object thường). Cuối cùng dùng `useQuery` bơm `httpTodoRepo` cho `OpenTodoCount` — comment từng dòng và ghi chú nơi nào là core/port/adapter/UI.

## Reference
- [Hexagonal Architecture (Cockburn)](https://alistair.cockburn.us/hexagonal-architecture/)
- [Ports & Adapters (Wikipedia)](https://en.wikipedia.org/wiki/Hexagonal_architecture_(software))