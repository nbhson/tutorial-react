# Store: Zustand + TanStack Query

> Nguồn: https://zustand.docs.pmnd.rs/ — https://tanstack.com/query/latest

## Mục tiêu

### 1. Phân biệt rõ client state (UI, auth, giỏ hàng) và server state (dữ liệu từ API)

Mục này dạy bạn chia đồ trước khi cất: state nào thuộc "nhà server", state nào thuộc "nhà mình". Chia sai từ đầu là nguồn gốc của mọi store khổng lồ khó bảo trì.

**Vì sao mục tiêu này tồn tại:** hầu hết app React thất bại ở chỗ nhét mọi thứ vào một store duy nhất. Dữ liệu từ server có vòng đời hoàn toàn khác dữ liệu UI: nó cần cache theo key, stale/refetch, retry, đồng bộ đa tab, còn UI state thì chỉ sống trong phiên mở trang. Trộn hai loại vào một chỗ khiến ta phải tự viết lại cache, loading, error, dedupe — vừa dài vừa sai ở biên (mất mạng, unmount giữa fetch, hai component cùng fetch một resource).

Nôm na: server state giống **ra chợ mua rau** — hàng có sẵn ở chợ, bạn chỉ cần nhớ "hôm nay đã mua gì, còn tươi không". Client state giống **cách bạn xếp đồ trên bàn làm việc** — chỉ có ý nghĩa với riêng bạn trong buổi này, tắt máy là mất. Mang rau về rồi tự dựng một cái chợ trong nhà thì khổ vô cùng — đó chính là việc copy server data vào store.

**Cơ chế phân biệt:** đặt câu hỏi "dữ liệu này có tồn tại trên server không, tắt app mở lại còn đúng không?". Nếu có (danh sách user, chi tiết sản phẩm, đơn hàng) → server state, giao cho TanStack Query giữ trong cache keyed. Nếu không (sidebar đóng/mở, modal nào đang mở, filter tạm chưa submit, giỏ nháp) → client state, giao cho Zustand. Hai hệ thống chạy song song, component đọc cả hai mà không copy qua lại.

**Code minh họa (comment tiếng Việt):**

> 📄 **Code ví dụ:** [`examples/01-1-phan-biet-ro-client-state-ui-auth.tsx`](examples/01-1-phan-biet-ro-client-state-ui-auth.tsx)

**Sai thì sao + fix:**

> 📄 **Code ví dụ:** [`examples/02-1-phan-biet-ro-client-state-ui-auth.tsx`](examples/02-1-phan-biet-ro-client-state-ui-auth.tsx)

**Usecase thực tế + quy tắc nhận diện:** trang thương mại điện tử có giỏ hàng nháp (chưa đăng nhập) + danh sách sản phẩm từ API. Giỏ nháp đổi liên tục khi bấm, chỉ sống ở client → Zustand + persist. Danh sách sản phẩm cần cache, phân trang, refetch khi focus lại → Query. Quy tắc: "cần refetch/invalidate/dedupe thì Query; cần đổi tức thì nhiều writer thì Zustand; form đang nhập thì useState/react-hook-form, không đưa vào store nào".

> **Tóm gọn 1 câu:** Hỏi "tắt app mở lại data còn đúng không" — còn đúng thì giao cho Query, chỉ sống trong phiên thì giao cho Zustand.

### 2. Dùng Zustand quản lý client state nhỏ gọn, selector tránh re-render thừa

Mục này nói về cách lấy state từ Zustand mà không làm component vẽ lại oan — chìa khóa là selector, giống gọi món từng món thay vì mua cả quán.

**Vì sao:** Context khiến mọi consumer re-render khi value đổi; Redux Boilerplate dài. Zustand cho store ngoài React với selector: component chỉ đăng ký đúng lát mình cần (`useUi(s => s.toggle)`), lát khác đổi không ảnh hưởng. Nhờ vậy cây lớn vẫn mượt mà code chỉ vài dòng.

**Cơ chế:** `create<T>()(fn)` tạo store giữ state + action. Mỗi `useStore(selector)` đăng ký một subscription với hàm chọn; sau mỗi `set`, Zustand chạy selector cũ/mới và so sánh bằng `Object.is`. Chỉ khi kết quả khác mới re-render component đó. Trả object mới trong selector (`s => ({a: s.a})`) mỗi lần là reference mới → re-render thừa, fix bằng `useShallow` hoặc tách từng field.

**Code minh họa:**

> 📄 **Code ví dụ:** [`examples/03-2-dung-zustand-quan-ly-client-state-nho.tsx`](examples/03-2-dung-zustand-quan-ly-client-state-nho.tsx)

**Sai thì sao:**

> 📄 **Code ví dụ:** [`examples/04-2-dung-zustand-quan-ly-client-state-nho.tsx`](examples/04-2-dung-zustand-quan-ly-client-state-nho.tsx)

> **Tóm gọn 1 câu:** Selector hẹp như gọi đúng món mình ăn — lát state khác đổi thì component bạn không phải vẽ lại.

### 3. Dùng TanStack Query v5 quản lý server state: cache, staleTime, mutation, invalidate

**Vì sao:** fetch thủ công bằng `useEffect` phải tự lo 5 việc: pending/error, retry, dedupe request trùng, cache giữa lần visit, refetch khi focus/reconnect. Query làm sẵn cả 5, code gọn ~60% mà đúng hơn ở biên. Mutation + invalidate tạo vòng đồng bộ chuẩn "sửa server → đánh dấu cache cũ → tự fetch lại", không cần setState tay.

**Cơ chế:** mỗi `useQuery({ queryKey, queryFn })` đăng ký một cache entry keyed bởi `queryKey` mảng phân cấp (`['users', id]`). `staleTime` quyết định bao lâu coi data còn tươi (không refetch khi mount lại); `gcTime` quyết định bao lâu xóa sau khi không ai dùng. `useMutation` gửi thay đổi; `onSuccess` gọi `invalidateQueries` đánh dấu key liên quan thành stale → Query tự refetch nền. `isPending` đúng cho lần tải đầu chưa có cache; `isFetching` đúng mỗi khi có request nền (kể cả đã có cache).

> **Tóm gọn 1 câu:** Query lo trọn gói "lấy – giữ – làm tươi" dữ liệu server: bạn khai báo key + hàm fetch, phần còn lại (cache, retry, refetch) máy tự lo.

## Tổng quan

Phần này vẽ bức tranh lớn: vì sao store một cục thất bại, và việc tách hai loại state giải quyết thế nào. Đọc xong phần này bạn sẽ biết mình đang giải bài toán gì trước khi mổ xẻ API.

Rất nhiều app thất bại khi nhét hết dữ liệu API vào một global store (Redux/Zustand): code phình to vì phải tự viết cache, self-handling loading/error, retry, sync multi-tab… mà vẫn sai chỗ. Ví dụ hai component cùng hiển thị một user: fetch tay sẽ gọi API hai lần, một nơi loading một nơi đã có data, sửa tên ở chỗ này chỗ kia không cập nhật. Thêm retry khi rớt mạng, refetch khi quay lại tab, optimistic update khi bấm thích — mỗi thứ thêm 20 dòng, nhân lên hàng chục resource là hàng nghìn dòng dễ vỡ.

Giải pháp được cộng đồng 2026 chốt lại: **server state để TanStack Query lo, client state để Zustand lo**. Query lo việc "lấy + giữ + vô hiệu hóa" dữ liệu remote: gọi một lần, cache theo key, dedupe request trùng trong cùng tick, retry theo cấu hình, refetch khi focus/reconnect, Devtools soi được cache. Zustand chỉ giữ thứ thuộc về phiên UI đang mở: sidebar, modal, tab, filter tạm, giỏ nháp, auth token. Hai hệ thống gặp nhau ở component (đọc cả hai) nhưng không bao giờ copy dữ liệu của nhau.

Áp dụng cho hầu hết app từ trung bình trở lên; với app nhỏ, chỉ cần một trong hai (chỉ UI không API thì Zustand; chỉ đọc API hiển thị thì Query, không cần Zustand). Không áp dụng Query cho form local state, animation state, hay dữ liệu realtime socket thuần — những thứ đó giữ ở `useState`/Zustand và đồng bộ vào Query qua `setQueryData` khi cần.

> **Tóm gọn 1 câu:** Server state để Query lo, client state để Zustand lo, hai bên gặp nhau ở component nhưng không bao giờ copy dữ liệu của nhau.

## Khái niệm cốt lõi

### 1. TanStack Query v5 — queryKey, staleTime, gcTime, isPending/isFetching

**Vì sao:** `queryKey` là danh tính của dữ liệu — giống số tủ đồ ở bể bơi: gõ đúng số thì lấy đúng đồ, thiếu số thì mở nhầm tủ người khác. Thiếu param trong key (`['users']` cho mọi id) khiến các user ghi đè nhau, UI nhảy data. `staleTime`/`gcTime` quyết định chi phí network: stale ngắn thì tươi nhưng tốn request; dài thì tiết kiệm nhưng dễ cũ. `isPending` vs `isFetching` quyết định UX: lần đầu chưa có gì thì skeleton trắng; có cache rồi refetch nền thì chỉ badge nhẹ, không đè trắng màn hình.

**Cơ chế chi tiết:** Query giữ `Map<queryKeyHash, entry>`. Khi component mount, nó hash key, tìm entry: chưa có → `isPending: true`, gọi `queryFn`, lưu data, đặt `updatedAt`. Có rồi và còn tươi (`now - updatedAt < staleTime`) → trả cache ngay, không fetch. Có rồi nhưng stale → trả cache ngay + fetch nền (`isFetching: true`), xong cập nhật. Unmount hết observer thì sau `gcTime` mới xóa entry. `retry` mặc định 3 lần với backoff; `refetchOnWindowFocus` mặc định bật.

**Code minh họa (comment tiếng Việt):**

> 📄 **Code ví dụ:** [`examples/05-1-tanstack-query-v5-querykey-staletime-gctime-ispending.tsx`](examples/05-1-tanstack-query-v5-querykey-staletime-gctime-ispending.tsx)

**Sai thì sao:**

> 📄 **Code ví dụ:** [`examples/06-1-tanstack-query-v5-querykey-staletime-gctime-ispending.tsx`](examples/06-1-tanstack-query-v5-querykey-staletime-gctime-ispending.tsx)

> **Tóm gọn 1 câu:** `queryKey` là số tủ đồ, `staleTime` là hạn dùng, `gcTime` là thời gian dọn tủ — đủ ba thứ thì cache chạy đúng như bạn kỳ vọng.

### 2. Mutation + Invalidate — vòng đồng bộ chuẩn

Mục này nói về vòng đời "sửa dữ liệu" trên server và cách cả app tự cập nhật theo — thay vì bạn chạy đi chạy lại gõ setState từng chỗ.

**Vì sao:** sau khi POST/PUT/DELETE, cache cũ đã sai. Tự `setState` tay dễ sót chỗ (list không cập nhật, detail không cập nhật). Invalidate đánh dấu "key này cũ rồi", Query tự fetch lại đúng chỗ, mọi component đọc key đó đều cập nhật.

**Cơ chế:** `useMutation({ mutationFn, onSuccess })` quản lý trạng thái gửi (pending/error). Trong `onSuccess` gọi `queryClient.invalidateQueries({ queryKey: ['todos'] })` — mọi query có key bắt đầu bằng `['todos']` chuyển stale và refetch nền. Có thể `exact: true` để chỉ đúng key, hoặc `predicate` để lọc tinh vi.

Nôm na: invalidate giống **dán tờ giấy "hàng hết hạn, phải nhập lại"** lên các tủ dữ liệu liên quan — bạn không cần đi đổ từng tủ, người quản lý kho (Query) tự nhập lại.

**Code minh họa:**

> 📄 **Code ví dụ:** [`examples/07-2-mutation-invalidate-vong-ong-bo-chuan.tsx`](examples/07-2-mutation-invalidate-vong-ong-bo-chuan.tsx)

> **Tóm gọn 1 câu:** Sửa server xong thì dán nhãn "cũ" lên key liên quan — Query tự fetch lại mọi chỗ đang đọc key đó.

### 3. Zustand — create, selector, Object.is, useShallow

**Vì sao:** store global mà component nào cũng re-render theo mọi update thì không khác Context. Selector + so sánh `Object.is` là thứ khiến Zustand nhanh: chỉ ai đọc lát đổi mới vẽ lại.

**Cơ chế:** `set(partial)` merge shallow, tạo state mới, thông báo subscriber. Mỗi subscriber chạy `selector(newState)` và `Object.is(oldSelected, newSelected)` — khác mới re-render. Vì vậy `useUi(s => s.toggle)` (function ổn định) gần như không bao giờ re-render thừa; `useUi(s => ({ a: s.a, b: s.b }))` tạo object mới mỗi lần → luôn khác → re-render mỗi update. Fix bằng `useShallow` (so sánh shallow từng field) hoặc tách selector.

Nôm na: `Object.is` là người soát vé **soi từng vé một**; còn so sánh hai "hộp quà" (object) thì nó chỉ nhìn hộp ngoài — hộp mới bọc lại dù đồ bên trong giống hệt vẫn bị coi là khác, nên phải dùng `useShallow` để mở hộp soi từng món.

**Code minh họa:**

> 📄 **Code ví dụ:** [`examples/08-3-zustand-create-selector-object-is-useshallow.tsx`](examples/08-3-zustand-create-selector-object-is-useshallow.tsx)

**Sai thì sao:**

> 📄 **Code ví dụ:** [`examples/09-3-zustand-create-selector-object-is-useshallow.tsx`](examples/09-3-zustand-create-selector-object-is-useshallow.tsx)

> **Tóm gọn 1 câu:** Selector trả object mới mỗi lần là vé "lúc nào cũng khác" — bọc `useShallow` để so từng field, hoặc tách selector hẹp hơn.

### 4. `persist` middleware + `partialize`

**Vì sao:** giỏ hàng, theme, sidebar muốn giữ qua refresh. Lưu cả store (gồm hàm, token nhạy cảm) vào localStorage vừa phí vừa rủi ro. `partialize` chọn đúng field cần lưu.

Nôm na: `persist` là **cất đồ vào ngăn kéo trước khi nghỉ việc** — `partialize` là quyết định "chỉ cất đồ cần thiết", đừng cất cả chìa khóa nhà (token) vào ngăn chung.

**Cơ chế:** `create(persist(fn, { name, partialize }))` — mỗi lần `set`, middleware serialize `partialize(state)` ra storage; lúc khởi tạo đọc lại và merge. Không `partialize` thì `JSON.stringify` cả function (mất) và token (lộ).

> 📄 **Code ví dụ:** [`examples/10-4-persist-middleware-partialize.tsx`](examples/10-4-persist-middleware-partialize.tsx)

> **Tóm gọn 1 câu:** `persist` giúp state sống qua refresh, còn `partialize` là tay lọc — chỉ cất data cần thiết, tuyệt đối không cất token hay function.

### 5. Đừng bao giờ copy server data vào Zustand

**Vì sao:** Query đã là cache sự thật. Copy sang Zustand tạo nguồn thứ hai: sửa một nơi quên nơi kia, invalidate không chạm tới bản copy, hai tab lệch nhau. Mọi "tối ưu đọc nhanh" kiểu này đều trả giá desync.

Nôm na: giống **chép danh sách khách từ sổ cái ra tờ giấy nhớ rồi quên đồng bộ** — sổ cái đã cập nhật, tờ giấy nhớ vẫn ghi thông tin cũ.

**Sai vs đúng:**

> 📄 **Code ví dụ:** [`examples/11-5-ung-bao-gio-copy-server-data-vao.tsx`](examples/11-5-ung-bao-gio-copy-server-data-vao.tsx)

> **Tóm gọn 1 câu:** Query là nguồn sự thật duy nhất cho server data — copy sang Zustand là tự tạo bản sao sẽ lệch nhau.

### 6. Optimistic update — onMutate/onError/onSettled

**Vì sao:** chờ server 500ms mới thấy nút "thích" đổi màu thì UX ì. Optimistic sửa cache ngay, sai thì rollback, xong thì invalidate — cảm giác tức thì mà vẫn đúng.

Nôm na: giống **gạch tên khách vào sổ trước khi hỏi bảng giá** — tin chắc là mua rồi nên ghi trước cho nhanh; hỏi xong thấy giá không hợp thì tẩy đi (rollback), mua thật thì đối chiếu sổ chính (invalidate).

**Cơ chế:** `onMutate` chạy trước request: `cancelQueries` để dừng refetch đua, `getQueryData` snapshot, `setQueryData` ghi giá trị giả lập. Lỗi → `onError` ghi lại snapshot. Xong → `onSettled` invalidate để lấy sự thật từ server.

> 📄 **Code ví dụ:** [`examples/12-6-optimistic-update-onmutate-onerror-onsettled.tsx`](examples/12-6-optimistic-update-onmutate-onerror-onsettled.tsx)

> **Tóm gọn 1 câu:** Optimistic update = ghi trước – có lỗi hoàn lại – xong thì đối chiếu server, qua 3 bước onMutate → onError → onSettled.

### 7. Infinite query + `queryClient` ở module scope

Mục cuối của bộ khái niệm: hai thứ hay gặp ở feed dài vô hạn và chỗ đặt `QueryClient` cho đúng — đặt sai là cả cache bay đi mỗi lần vẽ lại App.

`useInfiniteQuery({ queryKey, queryFn: ({ pageParam }) => ..., getNextPageParam })` giữ mảng `pages` cho feed vô hạn, kết hợp virtualization để render cửa sổ. `QueryClient` phải tạo một lần ở module scope và bọc `QueryClientProvider` — tạo trong render sẽ reset toàn bộ cache mỗi lần App vẽ lại. Nôm na: `QueryClient` là **chiếc tủ lạnh dùng chung cả nhà** — mua một cái đặt ở bếp (module scope), đừng mua cái mới mỗi lần vào bếp.

> 📄 **Code ví dụ:** [`examples/13-7-infinite-query-queryclient-o-module-scope.tsx`](examples/13-7-infinite-query-queryclient-o-module-scope.tsx)

> **Tóm gọn 1 câu:** Feed vô hạn dùng `useInfiniteQuery`, còn `QueryClient` tạo đúng một lần ngoài component — đặt trong render là mỗi lần vẽ lại mất sạch cache.

## Luồng hoạt động / Cách áp dụng

### Bước 1. Phân loại state: server → Query; phiên → Zustand

Mở từng màn hình, liệt kê mọi state và hỏi "tắt app mở lại, dữ liệu này còn đúng không?". Còn đúng (tên user, đơn hàng) → Query. Mất đi cũng được (modal đang mở, ô search đang gõ) → useState/Zustand. Ghi ra giấy hai cột trước khi viết code — 10 phút này tiết kiệm hàng giờ refactor sau.

> **Tóm gọn 1 câu:** Phân loại trên giấy trước khi code — mỗi state phải thuộc một trong hai cột: Query hoặc Zustand/useState.

### Bước 2. Bọc app bằng QueryClientProvider, đặt staleTime mặc định 30s–1p

Một provider ở entry, `staleTime` mặc định hợp lý để mọi query thừa hưởng. Data hiếm đổi (từ điển, quốc gia) override `staleTime: Infinity`; data cần tươi (giá coin) override `staleTime: 0` + `refetchInterval`.

> **Tóm gọn 1 câu:** Đặt staleTime mặc định ở provider một lần, chỗ nào đặc biệt thì override riêng — đừng chỉnh từng query bằng tay.

### Bước 3. Viết hook query cho từng resource với key factory

Key factory là "cuốn danh bạ key" viết một lần dùng suốt — invalidate hay refetch đều tra qua đây, không bao giờ gõ nhầm chuỗi.

Không rải chuỗi key khắp nơi. Tạo `userKeys = { all: ['users'], detail: (id: number) => ['users', id] }` — invalidate và refactor không bao giờ lệch chuỗi.

> **Tóm gọn 1 câu:** Gom mọi query key vào một factory như `userKeys.detail(id)` — invalidate không bao giờ lệch chuỗi gõ tay.

### Bước 4. Thay đổi qua mutation + invalidate (hoặc optimistic) — không setState từ queryFn

`queryFn` chỉ đọc (GET). Mọi ghi (POST/PUT/DELETE) qua `useMutation`. Tuyệt đối không gọi `setState` Zustand trong `queryFn` — nó chạy nền, retry, dedupe, gọi trong đó gây loop và desync.

> **Tóm gọn 1 câu:** Đọc qua `queryFn`, ghi qua `useMutation` — trộn hai việc này là tự đào hố loop và desync.

### Bước 5. State UI vào Zustand, thêm persist nếu cần giữ qua refresh

Bước cuối: dọn "nhà mình" — những gì thuộc phiên UI thì về Zustand, cái nào cần sống qua refresh thì bật persist.

Sidebar, modal, theme, giỏ nháp → `create`. Cần giữ → `persist` + `partialize`. Không nhét Date/function vào store (mất khi serialize, cảnh báo Devtools).

> **Tóm gọn 1 câu:** UI state về Zustand, cần sống qua refresh thì persist kèm `partialize` — đừng nhét Date/function vào store.

## Ví dụ chi tiết

Hai file ví dụ dưới đây là bản đầy đủ, mirror 1-1 với thư mục examples — dùng để đối chiếu code thật sau khi đọc lý thuyết.

Mirror 1-1 với `example.tsx` cùng thư mục (không rút gọn), chỉ thêm comment tiếng Việt:

> 📄 **Code ví dụ:** [`examples/14-vi-du-chi-tiet.tsx`](examples/14-vi-du-chi-tiet.tsx)

Ví dụ bổ sung — mutation + provider (pattern chuẩn đi kèm):

> 📄 **Code ví dụ:** [`examples/15-vi-du-chi-tiet.tsx`](examples/15-vi-du-chi-tiet.tsx)

> **Tóm gọn 1 câu:** Mở hai file ví dụ, chạy lên rồi thử sửa — code thật luôn dễ hiểu hơn mô tả.

## Giải thích từng phần

### `create<Ui>()((set) => ...)` — cú pháp curried bắt buộc của Zustand v5

Cặp `()` thứ hai không phải trang trí: nó giúp TypeScript suy luận kiểu qua hai giai đoạn (state trước, middleware sau). Viết `create<Ui>((set) => ...)` thiếu một cặp sẽ lỗi type khi thêm `persist`/`devtools`. Đây là cú pháp chuẩn v5, cách cũ vẫn chạy nhưng không khuyến nghị.

> **Tóm gọn 1 câu:** `create<T>()(...)` là cú pháp curried bắt buộc của Zustand v5 — thiếu cặp ngoặc thứ hai là lỗi type khi thêm middleware.

### `set((s) => ({...}))` — cập nhật immutable

Zustand so sánh tham chiếu nông, không deep-compare. Viết `s.sidebarOpen = true; return s` (mutate) giữ nguyên reference → không ai re-render. Luôn trả object mới. Với mảng: `[...s.items, x]` thay vì `s.items.push(x)`.

Nôm na: trả object mới như **xuất trình giấy tờ bản photo mới** — Zustand chỉ nhận ra "à, giấy mới, có thay đổi"; sửa bản gốc rồi đưa lại thì nó tưởng giấy cũ, bỏ qua không vẽ lại.

> **Tóm gọn 1 câu:** Luôn trả object/mảng mới thay vì sửa bản cũ — mutate in-place là Zustand không thấy gì đổi.

### `useUi((s) => s.toggle)` — selector hẹp

Không selector (`useUi()`) nghĩa là "đăng ký toàn bộ store" — bất kỳ field nào đổi cũng re-render. Selector hẹp nghĩa là "chỉ khi toggle đổi mới vẽ lại" — mà toggle là function ổn định nên gần như không bao giờ vẽ thừa. Với nhiều field dùng `useShallow`.

> **Tóm gọn 1 câu:** Selector càng hẹp càng ít vẽ lại — `useUi()` không selector là đăng ký cả store.

### `useQuery` tự động retry/cache/refetch

Mặc định retry 3 lần, cache giữa mount, `refetchOnWindowFocus` bật. Tắt khi không muốn tốn request (trang admin ít đổi). `isPending` chỉ đúng khi chưa có data — đã có cache mà refetch nền thì dùng `isFetching` để hiện badge nhẹ, không đè trắng.

> **Tóm gọn 1 câu:** `useQuery` mặc định retry 3 lần + refetch khi quay lại tab — muốn êm hơn thì chỉnh các flag này.

### `isPending` vs `isFetching` — hai tầng loading

`isPending = !data && đang fetch` → skeleton trắng toàn vùng. `isFetching = đang có request (có thể đã có data)` → chấm nhỏ "đang cập nhật". Dùng sai (lúc nào cũng skeleton) gây chớp trắng mỗi lần focus lại tab.

Nôm na: `isPending` là **quán chưa từng lên món** (phải chờ từ đầu), `isFetching` là **quán đang nộp lại món bổ sung** (bàn vẫn có đồ ăn sẵn để khách ăn trong lúc chờ).

> **Tóm gọn 1 câu:** `isPending` cho lần đầu trắng màn hình, `isFetching` cho badge "đang cập nhật" khi đã có cache.

## So sánh (nếu có)

### State thủ công (useState + useEffect fetch) vs Zustand + Query

Thủ công phải tự làm 5 việc Query có sẵn: track pending/error, retry, dedupe, cache, sync focus. Mỗi resource ~50 dòng, 10 resource ~500 dòng, vẫn sai ở race (unmount giữa fetch setState lên component đã chết). Query gọn ~60%, đúng ở biên, có Devtools soi cache. Chỉ giữ fetch tay cho demo 1 file hoặc API dùng một lần không cần cache.

> **Tóm gọn 1 câu:** Fetch tay tự làm đủ 5 việc mà vẫn sai ở race — Query làm sẵn cả 5 và ngắn hơn 60%.

### Lưu hết vào Zustand vs tách server/client

Lưu server data vào Zustand: mất cache theo key, mất staleTime/gcTime, mất refetch tự động, mỗi lần đổi phải sửa luồng setState tay ở N nơi. Tách ra: ít code hơn, data luôn khớp server sau invalidate, hai tab tự đồng bộ qua refetchOnWindowFocus.

> **Tóm gọn 1 câu:** Nhét server data vào Zustand là mất trọn bộ cache — tách hai loại state ra là ít code hơn mà data luôn khớp.

### TanStack Query vs SWR

Cùng ý tưởng cache-first theo key. Query mạnh hơn ở mutation/optimistic/infinite/devtools, cấu hình stale/gc tinh vi. SWR gọn nhẹ, API ít hơn, hợp nhu cầu đơn giản (blog cá nhân, landing). App vừa trở lên thường chọn Query.

> **Tóm gọn 1 câu:** App vừa trở lên chọn Query vì mutation/optimistic đầy đủ; app nhỏ cần đọc data đơn giản thì SWR gọn hơn.

## Lỗi thường gặp / Chống chỉ định

### 1. Copy server data vào Zustand rồi sửa 2 nơi → desync

> 📄 **Code ví dụ:** [`examples/16-1-copy-server-data-vao-zustand-roi-sua.tsx`](examples/16-1-copy-server-data-vao-zustand-roi-sua.tsx)

### 2. `queryKey` thiếu param → ghi đè cache

> 📄 **Code ví dụ:** [`examples/17-2-querykey-thieu-param-ghi-e-cache.tsx`](examples/17-2-querykey-thieu-param-ghi-e-cache.tsx)

### 3. Trả reference mới mỗi lần trong queryFn/select → loop

`queryFn` phải trả data từ server, không `concat` thêm mảng mới mỗi lần gọi (mỗi lần là reference mới, kết hợp `select` không ổn định gây tính lại vô hạn). Dùng `select` thuần + `structuralSharing` mặc định, hoặc memo kết quả dẫn xuất bằng `useMemo` ở component.

> **Tóm gọn 1 câu:** `queryFn` trả nguyên bản data từ server — tự concat/mutate tạo reference mới là gây loop vô hạn.

### 4. Invalidate quá rộng hoặc quá hẹp

`invalidateQueries({ queryKey: ['todos'] })` refetch cả list lẫn detail — tốn nhưng chắc. `exact: true` chỉ đúng key — tiết kiệm nhưng dễ sót. Quy tắc: mutation đổi list → invalidate gốc `['todos']`; đổi một item → invalidate `['todos', id]` + gốc nếu list hiển thị field đó. Dùng key factory để không lệch.

> **Tóm gọn 1 câu:** Invalidate rộng thì chắc nhưng tốn, hẹp thì tiết kiệm nhưng dễ sót — chọn theo mức mutation đụng tới và luôn đi qua key factory.

### 5. Chống chỉ định

App thuần form client-side chưa có API — Query là lớp thừa (giữ Zustand/useState). Realtime feed socket — đừng polling tay mỗi 2s, hãy để socket đẩy và `setQueryData` vào cache Query (cache vẫn là sự thật phía client, socket là nguồn cập nhật).

> **Tóm gọn 1 câu:** Không gắn Query vào app chưa có API, không polling tay khi có socket — socket đẩy thẳng vào cache bằng `setQueryData`.

## Câu hỏi thường gặp

### Khi nào dùng Zustand thay Query?

Phiên UI (sidebar, modal, filter tạm, giỏ nháp, theme) → Zustand. Phản chiếu server (list, detail, đơn hàng) → Query. Form đang nhập → useState/react-hook-form, chỉ khi submit mới qua mutation. Câu hỏi kiểm tra: "tắt app mở lại data này còn đúng không?" — còn đúng thì Query.

> **Tóm gọn 1 câu:** Sống trong phiên UI → Zustand; phản chiếu server → Query; form đang gõ → useState.

### `staleTime` khác `gcTime` thế nào?

`staleTime` = bao lâu coi data còn tươi (trong thời gian này mount lại không fetch). `gcTime` = sau khi không còn ai dùng, bao lâu thì xóa khỏi bộ nhớ. Ví dụ `staleTime: 30s, gcTime: 5p`: vào lại trong 30s thấy ngay không fetch; rời trang 2p quay lại thấy cache cũ + fetch nền; rời 10p quay lại fetch mới hoàn toàn.

> **Tóm gọn 1 câu:** `staleTime` là hạn dùng của thực phẩm trong tủ, `gcTime` là bao lâu thì vứt hộp sau khi không ai ăn nữa.

### Có cần Redux không?

Hầu hết app 2026 không — Zustand + Query phủ được. Redux Toolkit còn hợp khi cần event-sourcing/time-travel/undo phức tạp, hoặc team lớn đã chuẩn hóa DevTools/action log. Đừng thêm Redux "cho chắc" khi chưa có nhu cầu đó.

> **Tóm gọn 1 câu:** Đừng thêm Redux "cho chắc" — chỉ cần nó khi có event-sourcing/undo phức tạp thật sự.

### Query có thay form state không?

Không. Form là state cục bộ đổi từng phím, validate từng field — dùng `useState`/react-hook-form. Query chỉ vào khi submit (mutation) và khi cần hiển thị lại data server sau submit (invalidate).

> **Tóm gọn 1 câu:** Form vẫn là `useState`/react-hook-form — Query chỉ tham gia lúc submit và hiển thị lại data server.

### Làm sao tránh gọi API trùng khi nhiều component cùng query?

Dùng chung `queryKey` — Query tự dedupe request cùng key trong cùng tick thành một network call, cả hai component cùng nhận kết quả. Không cần lift state hay context chia data.

> **Tóm gọn 1 câu:** Cùng `queryKey` là Query tự gộp request trùng thành một — khỏi lift state hay context.

## Ghi chú 2026

Ba cập nhật của hệ sinh thái năm 2026 ảnh hưởng trực tiếp tới code trong bài — đọc để không dùng API cũ.

- **TanStack Query v5 đổi `isLoading` → `isPending`:** `isPending` chỉ đúng lần tải đầu chưa có data; thêm `isFetching` cho mọi request nền. Đọc đúng hai cờ để skeleton/badge không chớp sai. `isLoading` cũ vẫn tồn tại alias nhưng không khuyến nghị.

- **Zustand v5 curried + `useShallow`:** `create<T>()(...)` là chuẩn; selector nhiều field bọc `useShallow` để so sánh nông. Store lớn tách slice (`{...uiSlice, ...cartSlice}`) thay vì một object khổng lồ.

- **Kết hợp React Compiler:** selector và query options nên ổn định tham chiếu (key factory, `useMemo` cho `queryFn` phức tạp) để tránh fetch dư khi parent re-render. Compiler giảm render thừa nhưng không thay `staleTime`/dedupe của Query.

> **Tóm gọn 1 câu:** Nhớ 3 nhãn mới của 2026: `isPending`, cú pháp curried của Zustand v5, và giữ selector ổn định tham chiếu cho React Compiler.

## Best practices / Mẹo

### Đặt staleTime mặc định ở provider, override khi cần

> 📄 **Code ví dụ:** [`examples/18-at-staletime-mac-inh-o-provider-override-khi.tsx`](examples/18-at-staletime-mac-inh-o-provider-override-khi.tsx)

### useShallow cho selector nhiều field; tách store lớn thành slice

Store 20 field mà component cần 3 → `useShallow` hoặc tách `useUi`, `useCart` riêng. Một store khổng lồ khiến mọi `set` phải nghĩ "ai bị ảnh hưởng".

> **Tóm gọn 1 câu:** Store to thì tách slice, selector nhiều field thì bọc `useShallow` — đừng để một object khổng lồ cai trị tất cả.

### partialize trong persist — không lưu function/token

Chỉ lưu data thuần cần giữ (items, theme). Token nhạy cảm dùng `sessionStorage`/cookie httpOnly thay vì localStorage.

> **Tóm gọn 1 câu:** `partialize` chỉ cất data thuần — token nhạy cảm để cookie httpOnly, đừng vứt vào localStorage.

### Optimistic update cho nút "thích/lưu" — onMutate snapshot, onError rollback

UX tức thì, sai thì hoàn lại, xong thì invalidate. Không optimistic cho chuyển tiền/thanh toán — những thứ đó phải chờ server xác nhận mới hiện.

> **Tóm gọn 1 câu:** Optimistic cho thao tác vô hại kiểu "thích/lưu", tuyệt đối không optimistic cho chuyển tiền.

### Cài React Query Devtools + Zustand devtools khi dev

Nhìn được cache key nào, stale hay fresh, mutation nào đang pending. Bắt bệnh "sao không refetch" trong 10 giây thay vì đoán.

> **Tóm gọn 1 câu:** Cài Devtools cho cả hai — soi cache trực tiếp nhanh hơn đoán mò gấp chục lần.

### Query keys factory — userKeys.detail(id)

> 📄 **Code ví dụ:** [`examples/19-query-keys-factory-userkeys-detail-id.tsx`](examples/19-query-keys-factory-userkeys-detail-id.tsx)

### retry hợp lý; prefetch khi hover; setQueryData từ socket thay vì polling

`retry: false` cho OTP/thanh toán (tránh gửi trùng). `prefetchQuery` khi hover link để data sẵn trước điều hướng. Socket đẩy → `setQueryData` thay vì `setInterval` fetch.

> **Tóm gọn 1 câu:** OTP/thanh toán tắt retry, hover thì prefetch, socket đẩy thì `setQueryData` — ba mẹo nhỏ giúp app mượt và đỡ tốn request.

## Bài tập nhỏ

1. Tạo store `useCart` (Zustand + persist với `partialize` chỉ lưu items) cho giỏ hàng: `add`, `remove`, `clear`.
2. Tạo danh sách sản phẩm từ API bằng `useQuery(['products'])` với `staleTime: 30s`; mỗi card có nút "Thêm vào giỏ" gọi `useMutation` POST `/api/cart`, `onSuccess` invalidate `['cart']`.
3. Mở hai tab: bấm thêm ở tab 1, chuyển sang tab 2 xác nhận tự refetch (refetchOnWindowFocus) mà không cần reload.
4. Mở React Query Devtools: gọi cùng key ở hai component, xác nhận Network chỉ có một request (dedupe). Ghi lại số request trước/sau khi sửa key thiếu param.

> **Tóm gọn 1 câu:** Xong 4 bài này là bạn đã tự tay dựng đủ vòng đời: store, query, mutation, dedupe và Devtools.

## Reference

- [Zustand](https://zustand.docs.pmnd.rs/)
- [TanStack Query](https://tanstack.com/query/latest)
- [TanStack Query — mutations/invalidations](https://tanstack.com/query/latest/docs/framework/react/guides/mutations)

> **Tóm gọn 1 câu:** Chi tiết đầy đủ nằm ở docs chính thức của Zustand và TanStack Query — hai link đầu là gốc.
