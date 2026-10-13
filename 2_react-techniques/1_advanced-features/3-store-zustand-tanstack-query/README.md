# Store: Zustand + TanStack Query

> Nguồn: https://zustand.docs.pmnd.rs/ — https://tanstack.com/query/latest

## Mục tiêu

### 1. Phân biệt rõ client state (UI, auth, giỏ hàng) và server state (dữ liệu từ API)

**Vì sao mục tiêu này tồn tại:** hầu hết app React thất bại ở chỗ nhét mọi thứ vào một store duy nhất. Dữ liệu từ server có vòng đời hoàn toàn khác dữ liệu UI: nó cần cache theo key, stale/refetch, retry, đồng bộ đa tab, còn UI state thì chỉ sống trong phiên mở trang. Trộn hai loại vào một chỗ khiến ta phải tự viết lại cache, loading, error, dedupe — vừa dài vừa sai ở biên (mất mạng, unmount giữa fetch, hai component cùng fetch một resource).

**Cơ chế phân biệt:** đặt câu hỏi "dữ liệu này có tồn tại trên server không, tắt app mở lại còn đúng không?". Nếu có (danh sách user, chi tiết sản phẩm, đơn hàng) → server state, giao cho TanStack Query giữ trong cache keyed. Nếu không (sidebar đóng/mở, modal nào đang mở, filter tạm chưa submit, giỏ nháp) → client state, giao cho Zustand. Hai hệ thống chạy song song, component đọc cả hai mà không copy qua lại.

**Code minh họa (comment tiếng Việt):**

```tsx
// ✅ ĐÚNG: mỗi loại state một nơi — không copy server data vào Zustand
import { create } from 'zustand'; // client state: sidebar
import { useQuery } from '@tanstack/react-query'; // server state: user từ API

type Ui = { sidebarOpen: boolean; toggle: () => void };
export const useUi = create<Ui>()((set) => ({
  sidebarOpen: false,
  toggle: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
}));
// UserCard đọc user từ Query (cache theo ['users', id]), đọc toggle từ Zustand
```

**Sai thì sao + fix:**

```tsx
// ❌ SAI: copy server data vào Zustand — hai nguồn sự thật, dễ desync
const useStore = create<any>()((set) => ({ user: null, setUser: (u) => set({ user: u }) }));
function Sai({ id }: { id: number }) {
  const setUser = useStore((s) => s.setUser);
  useEffect(() => { fetch(`/api/users/${id}`).then((r) => r.json()).then(setUser); }, [id]);
  // phải tự lo loading, error, retry, cache, invalidate... rất dễ sót
  return null;
}

// ✅ ĐÚNG: server state để Query lo — tự có cache, retry, dedupe
function Dung({ id }: { id: number }) {
  const { data } = useQuery({ queryKey: ['users', id], queryFn: () => fetch(`/api/users/${id}`).then((r) => r.json()) });
  return <p>{data?.name}</p>;
}
```

**Usecase thực tế + quy tắc nhận diện:** trang thương mại điện tử có giỏ hàng nháp (chưa đăng nhập) + danh sách sản phẩm từ API. Giỏ nháp đổi liên tục khi bấm, chỉ sống ở client → Zustand + persist. Danh sách sản phẩm cần cache, phân trang, refetch khi focus lại → Query. Quy tắc: "cần refetch/invalidate/dedupe thì Query; cần đổi tức thì nhiều writer thì Zustand; form đang nhập thì useState/react-hook-form, không đưa vào store nào".

### 2. Dùng Zustand quản lý client state nhỏ gọn, selector tránh re-render thừa

**Vì sao:** Context khiến mọi consumer re-render khi value đổi; Redux Boilerplate dài. Zustand cho store ngoài React với selector: component chỉ đăng ký đúng lát mình cần (`useUi(s => s.toggle)`), lát khác đổi không ảnh hưởng. Nhờ vậy cây lớn vẫn mượt mà code chỉ vài dòng.

**Cơ chế:** `create<T>()(fn)` tạo store giữ state + action. Mỗi `useStore(selector)` đăng ký một subscription với hàm chọn; sau mỗi `set`, Zustand chạy selector cũ/mới và so sánh bằng `Object.is`. Chỉ khi kết quả khác mới re-render component đó. Trả object mới trong selector (`s => ({a: s.a})`) mỗi lần là reference mới → re-render thừa, fix bằng `useShallow` hoặc tách từng field.

**Code minh họa:**

```tsx
// ✅ ĐÚNG: selector hẹp — đổi sidebarOpen không re-render nút chỉ cần toggle
const toggle = useUi((s) => s.toggle); // hàm ổn định tham chiếu, không gây render thừa
```

**Sai thì sao:**

```tsx
// ❌ SAI: subscribe cả store — bất kỳ field nào đổi cũng re-render
const { sidebarOpen, toggle } = useUi(); // không selector → render theo mọi update

// ✅ ĐÚNG: selector hẹp từng field
const sidebarOpen = useUi((s) => s.sidebarOpen);
const toggle = useUi((s) => s.toggle);
```

### 3. Dùng TanStack Query v5 quản lý server state: cache, staleTime, mutation, invalidate

**Vì sao:** fetch thủ công bằng `useEffect` phải tự lo 5 việc: pending/error, retry, dedupe request trùng, cache giữa lần visit, refetch khi focus/reconnect. Query làm sẵn cả 5, code gọn ~60% mà đúng hơn ở biên. Mutation + invalidate tạo vòng đồng bộ chuẩn "sửa server → đánh dấu cache cũ → tự fetch lại", không cần setState tay.

**Cơ chế:** mỗi `useQuery({ queryKey, queryFn })` đăng ký một cache entry keyed bởi `queryKey` mảng phân cấp (`['users', id]`). `staleTime` quyết định bao lâu coi data còn tươi (không refetch khi mount lại); `gcTime` quyết định bao lâu xóa sau khi không ai dùng. `useMutation` gửi thay đổi; `onSuccess` gọi `invalidateQueries` đánh dấu key liên quan thành stale → Query tự refetch nền. `isPending` đúng cho lần tải đầu chưa có cache; `isFetching` đúng mỗi khi có request nền (kể cả đã có cache).

## Tổng quan

Rất nhiều app thất bại khi nhét hết dữ liệu API vào một global store (Redux/Zustand): code phình to vì phải tự viết cache, self-handling loading/error, retry, sync multi-tab… mà vẫn sai chỗ. Ví dụ hai component cùng hiển thị một user: fetch tay sẽ gọi API hai lần, một nơi loading một nơi đã có data, sửa tên ở chỗ này chỗ kia không cập nhật. Thêm retry khi rớt mạng, refetch khi quay lại tab, optimistic update khi bấm thích — mỗi thứ thêm 20 dòng, nhân lên hàng chục resource là hàng nghìn dòng dễ vỡ.

Giải pháp được cộng đồng 2026 chốt lại: **server state để TanStack Query lo, client state để Zustand lo**. Query lo việc "lấy + giữ + vô hiệu hóa" dữ liệu remote: gọi một lần, cache theo key, dedupe request trùng trong cùng tick, retry theo cấu hình, refetch khi focus/reconnect, Devtools soi được cache. Zustand chỉ giữ thứ thuộc về phiên UI đang mở: sidebar, modal, tab, filter tạm, giỏ nháp, auth token. Hai hệ thống gặp nhau ở component (đọc cả hai) nhưng không bao giờ copy dữ liệu của nhau.

Áp dụng cho hầu hết app từ trung bình trở lên; với app nhỏ, chỉ cần một trong hai (chỉ UI không API thì Zustand; chỉ đọc API hiển thị thì Query, không cần Zustand). Không áp dụng Query cho form local state, animation state, hay dữ liệu realtime socket thuần — những thứ đó giữ ở `useState`/Zustand và đồng bộ vào Query qua `setQueryData` khi cần.

## Khái niệm cốt lõi

### 1. TanStack Query v5 — queryKey, staleTime, gcTime, isPending/isFetching

**Vì sao:** `queryKey` là danh tính của dữ liệu. Thiếu param trong key (`['users']` cho mọi id) khiến các user ghi đè nhau, UI nhảy data. `staleTime`/`gcTime` quyết định chi phí network: stale ngắn thì tươi nhưng tốn request; dài thì tiết kiệm nhưng dễ cũ. `isPending` vs `isFetching` quyết định UX: lần đầu chưa có gì thì skeleton trắng; có cache rồi refetch nền thì chỉ badge nhẹ, không đè trắng màn hình.

**Cơ chế chi tiết:** Query giữ `Map<queryKeyHash, entry>`. Khi component mount, nó hash key, tìm entry: chưa có → `isPending: true`, gọi `queryFn`, lưu data, đặt `updatedAt`. Có rồi và còn tươi (`now - updatedAt < staleTime`) → trả cache ngay, không fetch. Có rồi nhưng stale → trả cache ngay + fetch nền (`isFetching: true`), xong cập nhật. Unmount hết observer thì sau `gcTime` mới xóa entry. `retry` mặc định 3 lần với backoff; `refetchOnWindowFocus` mặc định bật.

**Code minh họa (comment tiếng Việt):**

```tsx
// ✅ ĐÚNG: key chứa toàn bộ tham số xác định dữ liệu — mỗi id một cache riêng
const { data, isPending, isFetching, isError } = useQuery({
  queryKey: ['users', id], // hash khác nhau theo id → không ghi đè nhau
  queryFn: () => fetch(`/api/users/${id}`).then((r) => {
    if (!r.ok) throw new Error('Fetch failed'); // ném để Query biết mà retry
    return r.json();
  }),
  staleTime: 30_000, // 30s coi là tươi — mount lại trong 30s không fetch lại
});
// Render: isPending → skeleton trắng; có data + isFetching → badge "đang cập nhật" nhẹ
```

**Sai thì sao:**

```tsx
// ❌ SAI: key thiếu id — user 1 và user 2 dùng chung cache, mở user 2 thấy data user 1
useQuery({ queryKey: ['users'], queryFn: () => fetch(`/api/users/${id}`).then((r) => r.json()) });

// ✅ ĐÚNG: đưa id vào key
useQuery({ queryKey: ['users', id], queryFn: () => fetch(`/api/users/${id}`).then((r) => r.json()) });
```

### 2. Mutation + Invalidate — vòng đồng bộ chuẩn

**Vì sao:** sau khi POST/PUT/DELETE, cache cũ đã sai. Tự `setState` tay dễ sót chỗ (list không cập nhật, detail không cập nhật). Invalidate đánh dấu "key này cũ rồi", Query tự fetch lại đúng chỗ, mọi component đọc key đó đều cập nhật.

**Cơ chế:** `useMutation({ mutationFn, onSuccess })` quản lý trạng thái gửi (pending/error). Trong `onSuccess` gọi `queryClient.invalidateQueries({ queryKey: ['todos'] })` — mọi query có key bắt đầu bằng `['todos']` chuyển stale và refetch nền. Có thể `exact: true` để chỉ đúng key, hoặc `predicate` để lọc tinh vi.

**Code minh họa:**

```tsx
import { useMutation, useQueryClient } from '@tanstack/react-query';

// ✅ ĐÚNG: mutation xong invalidate — list tự refetch, không setState tay
function NutThem() {
  const qc = useQueryClient();
  const m = useMutation({
    mutationFn: (ten: string) => fetch('/api/todos', { method: 'POST', body: JSON.stringify({ ten }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['todos'] }), // đánh dấu cũ → tự tải lại
  });
  return <button onClick={() => m.mutate('Mua sữa')} disabled={m.isPending}>Thêm</button>;
}
```

### 3. Zustand — create, selector, Object.is, useShallow

**Vì sao:** store global mà component nào cũng re-render theo mọi update thì không khác Context. Selector + so sánh `Object.is` là thứ khiến Zustand nhanh: chỉ ai đọc lát đổi mới vẽ lại.

**Cơ chế:** `set(partial)` merge shallow, tạo state mới, thông báo subscriber. Mỗi subscriber chạy `selector(newState)` và `Object.is(oldSelected, newSelected)` — khác mới re-render. Vì vậy `useUi(s => s.toggle)` (function ổn định) gần như không bao giờ re-render thừa; `useUi(s => ({ a: s.a, b: s.b }))` tạo object mới mỗi lần → luôn khác → re-render mỗi update. Fix bằng `useShallow` (so sánh shallow từng field) hoặc tách selector.

**Code minh họa:**

```tsx
import { useShallow } from 'zustand/react/shallow';

// ✅ ĐÚNG: nhiều field mà không render thừa — so shallow thay vì Object.is
const { a, b } = useUi(useShallow((s) => ({ a: s.a, b: s.b })));
```

**Sai thì sao:**

```tsx
// ❌ SAI: object mới mỗi lần — re-render dù a, b không đổi
const { a, b } = useUi((s) => ({ a: s.a, b: s.b }));

// ✅ ĐÚNG: bọc useShallow
const { a, b } = useUi(useShallow((s) => ({ a: s.a, b: s.b })));
```

### 4. `persist` middleware + `partialize`

**Vì sao:** giỏ hàng, theme, sidebar muốn giữ qua refresh. Lưu cả store (gồm hàm, token nhạy cảm) vào localStorage vừa phí vừa rủi ro. `partialize` chọn đúng field cần lưu.

**Cơ chế:** `create(persist(fn, { name, partialize }))` — mỗi lần `set`, middleware serialize `partialize(state)` ra storage; lúc khởi tạo đọc lại và merge. Không `partialize` thì `JSON.stringify` cả function (mất) và token (lộ).

```tsx
// ✅ ĐÚNG: chỉ lưu giỏ, không lưu hàm/token
import { persist } from 'zustand/middleware';
type Cart = { items: string[]; token: string; add: (x: string) => void };
export const useCart = create<Cart>()(persist((set) => ({
  items: [], token: '',
  add: (x) => set((s) => ({ items: [...s.items, x] })),
}), { name: 'cart', partialize: (s) => ({ items: s.items } as Cart) }));
```

### 5. Đừng bao giờ copy server data vào Zustand

**Vì sao:** Query đã là cache sự thật. Copy sang Zustand tạo nguồn thứ hai: sửa một nơi quên nơi kia, invalidate không chạm tới bản copy, hai tab lệch nhau. Mọi "tối ưu đọc nhanh" kiểu này đều trả giá desync.

**Sai vs đúng:**

```tsx
// ❌ SAI: copy data Query vào Zustand — desync khi invalidate
const d = useQuery({ queryKey: ['u', id], queryFn: fetchUser });
useEffect(() => { if (d.data) useUi.setState({ userCopy: d.data }); }, [d.data]);

// ✅ ĐÚNG: đọc trực tiếp từ Query mọi nơi — một nguồn sự thật
const { data } = useQuery({ queryKey: ['u', id], queryFn: fetchUser });
```

### 6. Optimistic update — onMutate/onError/onSettled

**Vì sao:** chờ server 500ms mới thấy nút "thích" đổi màu thì UX ì. Optimistic sửa cache ngay, sai thì rollback, xong thì invalidate — cảm giác tức thì mà vẫn đúng.

**Cơ chế:** `onMutate` chạy trước request: `cancelQueries` để dừng refetch đua, `getQueryData` snapshot, `setQueryData` ghi giá trị giả lập. Lỗi → `onError` ghi lại snapshot. Xong → `onSettled` invalidate để lấy sự thật từ server.

```tsx
// ✅ ĐÚNG: thích ngay, lỗi thì hoàn lại, xong thì đồng bộ server
useMutation({
  mutationFn: (id: number) => fetch(`/api/like/${id}`, { method: 'POST' }),
  onMutate: async (id) => {
    const qc = useQueryClient(); // lấy client
    await qc.cancelQueries({ queryKey: ['posts'] }); // dừng fetch đua
    const prev = qc.getQueryData(['posts']); // snapshot để rollback
    qc.setQueryData(['posts'], (cu: any) => cu.map((p: any) => p.id === id ? { ...p, liked: true } : p));
    return { prev }; // trả context cho onError
  },
  onError: (_e, _v, ctx) => useQueryClient().setQueryData(['posts'], ctx?.prev),
  onSettled: () => useQueryClient().invalidateQueries({ queryKey: ['posts'] }),
});
```

### 7. Infinite query + `queryClient` ở module scope

`useInfiniteQuery({ queryKey, queryFn: ({ pageParam }) => ..., getNextPageParam })` giữ mảng `pages` cho feed vô hạn, kết hợp virtualization để render cửa sổ. `QueryClient` phải tạo một lần ở module scope và bọc `QueryClientProvider` — tạo trong render sẽ reset toàn bộ cache mỗi lần App vẽ lại.

```tsx
// ❌ SAI: tạo client trong component — mỗi render reset cache
function App() { const qc = new QueryClient(); return <QueryClientProvider client={qc} />; }
// ✅ ĐÚNG: một client duy nhất ở module scope
const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 30_000 } } });
export function App({ children }: { children: React.ReactNode }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
```

## Luồng hoạt động / Cách áp dụng

### Bước 1. Phân loại state: server → Query; phiên → Zustand

Mở từng màn hình, liệt kê mọi state và hỏi "tắt app mở lại, dữ liệu này còn đúng không?". Còn đúng (tên user, đơn hàng) → Query. Mất đi cũng được (modal đang mở, ô search đang gõ) → useState/Zustand. Ghi ra giấy hai cột trước khi viết code — 10 phút này tiết kiệm hàng giờ refactor sau.

### Bước 2. Bọc app bằng QueryClientProvider, đặt staleTime mặc định 30s–1p

Một provider ở entry, `staleTime` mặc định hợp lý để mọi query thừa hưởng. Data hiếm đổi (từ điển, quốc gia) override `staleTime: Infinity`; data cần tươi (giá coin) override `staleTime: 0` + `refetchInterval`.

### Bước 3. Viết hook query cho từng resource với key factory

Không rải chuỗi key khắp nơi. Tạo `userKeys = { all: ['users'], detail: (id: number) => ['users', id] }` — invalidate và refactor không bao giờ lệch chuỗi.

### Bước 4. Thay đổi qua mutation + invalidate (hoặc optimistic) — không setState từ queryFn

`queryFn` chỉ đọc (GET). Mọi ghi (POST/PUT/DELETE) qua `useMutation`. Tuyệt đối không gọi `setState` Zustand trong `queryFn` — nó chạy nền, retry, dedupe, gọi trong đó gây loop và desync.

### Bước 5. State UI vào Zustand, thêm persist nếu cần giữ qua refresh

Sidebar, modal, theme, giỏ nháp → `create`. Cần giữ → `persist` + `partialize`. Không nhét Date/function vào store (mất khi serialize, cảnh báo Devtools).

## Ví dụ chi tiết

Mirror 1-1 với `example.tsx` cùng thư mục (không rút gọn), chỉ thêm comment tiếng Việt:

```tsx
// ---------- Zustand: client state ----------
// Vì sao tách: sidebar là trạng thái phiên UI — không cần cache, retry, invalidate
import { create } from 'zustand';

// Kiểu store: state + action trong cùng type — đọc một nơi hiểu hết
type Ui = { sidebarOpen: boolean; toggle: () => void };
export const useUi = create<Ui>()((set) => ({
  sidebarOpen: false, // giá trị khởi đầu: sidebar đóng
  // set((s) => ...) dùng state hiện tại — an toàn cả khi gọi nhiều lần liên tiếp
  toggle: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
}));

// ---------- TanStack Query: server state ----------
// Vì sao tách: user từ API cần cache theo id, retry, dedupe — Query làm sẵn
import { useQuery } from '@tanstack/react-query';

export function UserCard({ id }: { id: number }) {
  // queryKey ['users', id]: mỗi id một cache riêng — không ghi đè nhau
  const { data, isPending, isError } = useQuery({
    queryKey: ['users', id],
    queryFn: () =>
      fetch(`https://jsonplaceholder.typicode.com/users/${id}`).then((r) => {
        // ném lỗi để Query biết đây là lỗi fetch → tự retry theo cấu hình
        if (!r.ok) throw new Error('Fetch failed');
        return r.json();
      }),
  });
  // selector chọn đúng 1 action cần — đổi field khác không re-render UserCard
  // Vì sao hẹp: Object.is so sánh kết quả selector — function toggle ổn định nên không render thừa
  const toggle = useUi((s) => s.toggle);
  if (isPending) return <p>Đang tải…</p>; // lần đầu chưa có cache → skeleton trắng
  if (isError) return <p>Lỗi tải user.</p>; // fetch lỗi sau retry → báo lỗi
  return (
    <div>
      <h3>{data.name}</h3>
      <button onClick={toggle}>Đóng/mở sidebar</button>
    </div>
  );
}
```

Ví dụ bổ sung — mutation + provider (pattern chuẩn đi kèm):

```tsx
// Chuẩn đi kèm: provider một lần + mutation invalidate
import { QueryClient, QueryClientProvider, useMutation, useQueryClient } from '@tanstack/react-query';

// Một client duy nhất ở module scope — tạo trong render là reset cache mỗi lần vẽ
const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, retry: 2 } } });

export function Providers({ children }: { children: React.ReactNode }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
```

## Giải thích từng phần

### `create<Ui>()((set) => ...)` — cú pháp curried bắt buộc của Zustand v5

Cặp `()` thứ hai không phải trang trí: nó giúp TypeScript suy luận kiểu qua hai giai đoạn (state trước, middleware sau). Viết `create<Ui>((set) => ...)` thiếu một cặp sẽ lỗi type khi thêm `persist`/`devtools`. Đây là cú pháp chuẩn v5, cách cũ vẫn chạy nhưng không khuyến nghị.

### `set((s) => ({...}))` — cập nhật immutable

Zustand so sánh tham chiếu nông, không deep-compare. Viết `s.sidebarOpen = true; return s` (mutate) giữ nguyên reference → không ai re-render. Luôn trả object mới. Với mảng: `[...s.items, x]` thay vì `s.items.push(x)`.

### `useUi((s) => s.toggle)` — selector hẹp

Không selector (`useUi()`) nghĩa là "đăng ký toàn bộ store" — bất kỳ field nào đổi cũng re-render. Selector hẹp nghĩa là "chỉ khi toggle đổi mới vẽ lại" — mà toggle là function ổn định nên gần như không bao giờ vẽ thừa. Với nhiều field dùng `useShallow`.

### `useQuery` tự động retry/cache/refetch

Mặc định retry 3 lần, cache giữa mount, `refetchOnWindowFocus` bật. Tắt khi không muốn tốn request (trang admin ít đổi). `isPending` chỉ đúng khi chưa có data — đã có cache mà refetch nền thì dùng `isFetching` để hiện badge nhẹ, không đè trắng.

### `isPending` vs `isFetching` — hai tầng loading

`isPending = !data && đang fetch` → skeleton trắng toàn vùng. `isFetching = đang có request (có thể đã có data)` → chấm nhỏ "đang cập nhật". Dùng sai (lúc nào cũng skeleton) gây chớp trắng mỗi lần focus lại tab.

## So sánh (nếu có)

### State thủ công (useState + useEffect fetch) vs Zustand + Query

Thủ công phải tự làm 5 việc Query có sẵn: track pending/error, retry, dedupe, cache, sync focus. Mỗi resource ~50 dòng, 10 resource ~500 dòng, vẫn sai ở race (unmount giữa fetch setState lên component đã chết). Query gọn ~60%, đúng ở biên, có Devtools soi cache. Chỉ giữ fetch tay cho demo 1 file hoặc API dùng một lần không cần cache.

### Lưu hết vào Zustand vs tách server/client

Lưu server data vào Zustand: mất cache theo key, mất staleTime/gcTime, mất refetch tự động, mỗi lần đổi phải sửa luồng setState tay ở N nơi. Tách ra: ít code hơn, data luôn khớp server sau invalidate, hai tab tự đồng bộ qua refetchOnWindowFocus.

### TanStack Query vs SWR

Cùng ý tưởng cache-first theo key. Query mạnh hơn ở mutation/optimistic/infinite/devtools, cấu hình stale/gc tinh vi. SWR gọn nhẹ, API ít hơn, hợp nhu cầu đơn giản (blog cá nhân, landing). App vừa trở lên thường chọn Query.

## Lỗi thường gặp / Chống chỉ định

### 1. Copy server data vào Zustand rồi sửa 2 nơi → desync

```tsx
// ❌ SAI: hai nguồn sự thật
const { data } = useQuery({ queryKey: ['u', 1], queryFn: fetchUser });
useEffect(() => { useStore.setState({ user: data }); }, [data]); // invalidate không chạm bản copy

// ✅ ĐÚNG: một nguồn — đọc thẳng từ Query; sửa qua mutation + optimistic
```

### 2. `queryKey` thiếu param → ghi đè cache

```tsx
// ❌ SAI: mọi id chung key ['users']
useQuery({ queryKey: ['users'], queryFn: () => fetch(`/api/users/${id}`).then((r) => r.json()) });
// ✅ ĐÚNG: key chứa id
useQuery({ queryKey: ['users', id], queryFn: () => fetch(`/api/users/${id}`).then((r) => r.json()) });
```

### 3. Trả reference mới mỗi lần trong queryFn/select → loop

`queryFn` phải trả data từ server, không `concat` thêm mảng mới mỗi lần gọi (mỗi lần là reference mới, kết hợp `select` không ổn định gây tính lại vô hạn). Dùng `select` thuần + `structuralSharing` mặc định, hoặc memo kết quả dẫn xuất bằng `useMemo` ở component.

### 4. Invalidate quá rộng hoặc quá hẹp

`invalidateQueries({ queryKey: ['todos'] })` refetch cả list lẫn detail — tốn nhưng chắc. `exact: true` chỉ đúng key — tiết kiệm nhưng dễ sót. Quy tắc: mutation đổi list → invalidate gốc `['todos']`; đổi một item → invalidate `['todos', id]` + gốc nếu list hiển thị field đó. Dùng key factory để không lệch.

### 5. Chống chỉ định

App thuần form client-side chưa có API — Query là lớp thừa (giữ Zustand/useState). Realtime feed socket — đừng polling tay mỗi 2s, hãy để socket đẩy và `setQueryData` vào cache Query (cache vẫn là sự thật phía client, socket là nguồn cập nhật).

## Câu hỏi thường gặp

### Khi nào dùng Zustand thay Query?

Phiên UI (sidebar, modal, filter tạm, giỏ nháp, theme) → Zustand. Phản chiếu server (list, detail, đơn hàng) → Query. Form đang nhập → useState/react-hook-form, chỉ khi submit mới qua mutation. Câu hỏi kiểm tra: "tắt app mở lại data này còn đúng không?" — còn đúng thì Query.

### `staleTime` khác `gcTime` thế nào?

`staleTime` = bao lâu coi data còn tươi (trong thời gian này mount lại không fetch). `gcTime` = sau khi không còn ai dùng, bao lâu thì xóa khỏi bộ nhớ. Ví dụ `staleTime: 30s, gcTime: 5p`: vào lại trong 30s thấy ngay không fetch; rời trang 2p quay lại thấy cache cũ + fetch nền; rời 10p quay lại fetch mới hoàn toàn.

### Có cần Redux không?

Hầu hết app 2026 không — Zustand + Query phủ được. Redux Toolkit còn hợp khi cần event-sourcing/time-travel/undo phức tạp, hoặc team lớn đã chuẩn hóa DevTools/action log. Đừng thêm Redux "cho chắc" khi chưa có nhu cầu đó.

### Query có thay form state không?

Không. Form là state cục bộ đổi từng phím, validate từng field — dùng `useState`/react-hook-form. Query chỉ vào khi submit (mutation) và khi cần hiển thị lại data server sau submit (invalidate).

### Làm sao tránh gọi API trùng khi nhiều component cùng query?

Dùng chung `queryKey` — Query tự dedupe request cùng key trong cùng tick thành một network call, cả hai component cùng nhận kết quả. Không cần lift state hay context chia data.

## Ghi chú 2026

- **TanStack Query v5 đổi `isLoading` → `isPending`:** `isPending` chỉ đúng lần tải đầu chưa có data; thêm `isFetching` cho mọi request nền. Đọc đúng hai cờ để skeleton/badge không chớp sai. `isLoading` cũ vẫn tồn tại alias nhưng không khuyến nghị.

- **Zustand v5 curried + `useShallow`:** `create<T>()(...)` là chuẩn; selector nhiều field bọc `useShallow` để so sánh nông. Store lớn tách slice (`{...uiSlice, ...cartSlice}`) thay vì một object khổng lồ.

- **Kết hợp React Compiler:** selector và query options nên ổn định tham chiếu (key factory, `useMemo` cho `queryFn` phức tạp) để tránh fetch dư khi parent re-render. Compiler giảm render thừa nhưng không thay `staleTime`/dedupe của Query.

## Best practices / Mẹo

### Đặt staleTime mặc định ở provider, override khi cần

```tsx
// ✅ ĐÚNG: mặc định 30s cho mọi query, data tĩnh override Infinity
const qc = new QueryClient({ defaultOptions: { queries: { staleTime: 30_000 } } });
useQuery({ queryKey: ['tinh'], queryFn: fetchTinh, staleTime: Infinity }); // hiếm đổi
```

### useShallow cho selector nhiều field; tách store lớn thành slice

Store 20 field mà component cần 3 → `useShallow` hoặc tách `useUi`, `useCart` riêng. Một store khổng lồ khiến mọi `set` phải nghĩ "ai bị ảnh hưởng".

### partialize trong persist — không lưu function/token

Chỉ lưu data thuần cần giữ (items, theme). Token nhạy cảm dùng `sessionStorage`/cookie httpOnly thay vì localStorage.

### Optimistic update cho nút "thích/lưu" — onMutate snapshot, onError rollback

UX tức thì, sai thì hoàn lại, xong thì invalidate. Không optimistic cho chuyển tiền/thanh toán — những thứ đó phải chờ server xác nhận mới hiện.

### Cài React Query Devtools + Zustand devtools khi dev

Nhìn được cache key nào, stale hay fresh, mutation nào đang pending. Bắt bệnh "sao không refetch" trong 10 giây thay vì đoán.

### Query keys factory — userKeys.detail(id)

```tsx
// ✅ ĐÚNG: một nơi định nghĩa key — invalidate không bao giờ lệch chuỗi
export const userKeys = { all: ['users'] as const, detail: (id: number) => ['users', id] as const };
```

### retry hợp lý; prefetch khi hover; setQueryData từ socket thay vì polling

`retry: false` cho OTP/thanh toán (tránh gửi trùng). `prefetchQuery` khi hover link để data sẵn trước điều hướng. Socket đẩy → `setQueryData` thay vì `setInterval` fetch.

## Bài tập nhỏ

1. Tạo store `useCart` (Zustand + persist với `partialize` chỉ lưu items) cho giỏ hàng: `add`, `remove`, `clear`.
2. Tạo danh sách sản phẩm từ API bằng `useQuery(['products'])` với `staleTime: 30s`; mỗi card có nút "Thêm vào giỏ" gọi `useMutation` POST `/api/cart`, `onSuccess` invalidate `['cart']`.
3. Mở hai tab: bấm thêm ở tab 1, chuyển sang tab 2 xác nhận tự refetch (refetchOnWindowFocus) mà không cần reload.
4. Mở React Query Devtools: gọi cùng key ở hai component, xác nhận Network chỉ có một request (dedupe). Ghi lại số request trước/sau khi sửa key thiếu param.

## Reference

- [Zustand](https://zustand.docs.pmnd.rs/)
- [TanStack Query](https://tanstack.com/query/latest)
- [TanStack Query — mutations/invalidations](https://tanstack.com/query/latest/docs/framework/react/guides/mutations)
