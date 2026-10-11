# Store: Zustand + TanStack Query

> Nguồn: https://zustand.docs.pmnd.rs/ — https://tanstack.com/query/latest

## Mục tiêu
- Phân biệt rõ **client state** (UI, auth, giỏ hàng) và **server state** (dữ liệu từ API).
- Dùng Zustand quản lý client state nhỏ gọn, selector tránh re-render thừa.
- Dùng TanStack Query v5 quản lý server state: cache, staleTime, mutation, invalidate — không lặp lại fetch boilerplate.

## Tổng quan
Rất nhiều app thất bại khi nhét hết dữ liệu API vào một global store (Redux/Zustand): code phình to vì phải tự viết cache, self-handling loading/error, retry, sync multi-tab… mà vẫn sai chỗ. Giải pháp được cộng đồng 2026 chốt lại: **server state để TanStack Query lo, client state để Zustand lo**. Query lo việc "lấy + giữ + vô hiệu hóa" dữ liệu remote; Zustand chỉ giữ thứ thuộc về phiên UI đang mở. Áp dụng cho hầu hết app từ trung bình trở lên; với app nhỏ, chỉ cần một trong hai.

## Khái niệm cốt lõi
- **TanStack Query v5** dùng `queryKey` (mảng phân cấp, ví dụ `['users', id]`) để định danh và cache dữ liệu. Các setting quan trọng: `staleTime` (bao lâu coi data còn mới — không refetch), `gcTime` (bao lâu xóa khỏi cache sau khi không dùng), `retry`, `refetchOnWindowFocus`. `isPending` (v5, thay `isLoading` ở v4) chỉ đúng cho lần tải đầu, `isFetching` = đang gọi network bất kể có cache hay không.
- **Mutation + Invalidate**: `useMutation` gửi thay đổi lên server; sau khi thành công gọi `queryClient.invalidateQueries({ queryKey: ['todos'] })` để query liên quan tự refetch — đây là vòng đồng bộ chuẩn "mutation → refetch".
- **Zustand**: store tạo bằng `create<T>()(...)`. Component chỉ nên subcribe **một slice nhỏ** qua selector (`useStore(s => s.cart)`); Zustand dùng `Object.is` so sánh kết quả selector để quyết định re-render. Muốn vài field cùng lúc dùng `useShallow` để tránh re-render khi object trả về mới nhưng giá trị không đổi.
- **`persist` middleware**: lưu state (mặc định localStorage); `partialize` giới hạn chỉ lưu field cần, không lưu hàm/token nhạy cảm nếu cần.
- **Đừng bao giờ copy server data vào Zustand**: Query đã cache; lưu thêm bản sao là nguồn gây desync.
- **Optimistic update**: `useMutation` có `onMutate` sửa cache ngay (`queryClient.setQueryData`) trước khi server trả lời, `onError` rollback snapshot, `onSettled` invalidate. Cảm giác "tức thì" mà vẫn đúng khi lỗi.
- **Infinite query**: `useInfiniteQuery` + `getNextPageParam` cho feed phân trang; kết hợp TanStack Virtual (bài nhóm performance) để render cửa sổ.
- **Selector và re-render**: Zustand so sánh kết quả selector bằng `Object.is`; trả object/array mới trong selector ⇒ re-render mỗi update. Dùng `useShallow` hoặc trả từng field riêng.
- **`queryClient` ở ngoài component**: tạo một `QueryClient` duy nhất (module scope) và truyền vào `QueryClientProvider`; tạo mới trong render sẽ reset cache mỗi lần App render.

## Luồng hoạt động / Cách áp dụng
1. Phân loại state: cái nào phụ thuộc server → Query; cái nào thuộc phiên → Zustand.
2. Bọc app bằng `<QueryClientProvider client={queryClient}>`, cấu hình `staleTime` mặc định hợp lý (30s–1p).
3. Viết hook query cho từng resource: `useQuery({ queryKey: ['users', id], queryFn, staleTime })`.
4. Thay đổi data qua `useMutation` + `invalidateQueries` (hoặc optimistic update) — tuyệt đối không `setState` từ `queryFn`.
5. State UI (sidebar, modal, cart tạm) vào `create` của Zustand, thêm `persist` nếu cần giữ qua refresh.

## Ví dụ chi tiết
```tsx
// ---------- Zustand: client state ----------
import { create } from 'zustand';

// Kiểu store: state + action trong cùng type
type Ui = { sidebarOpen: boolean; toggle: () => void };
export const useUi = create<Ui>()((set) => ({
  sidebarOpen: false,
  // set((s) => ...) dùng state hiện tại — an toàn cả khi gọi nhiều lần
  toggle: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
}));

// ---------- TanStack Query: server state ----------
import { useQuery } from '@tanstack/react-query';

export function UserCard({ id }: { id: number }) {
  // queryKey ['users', id]: mỗi id một cache riêng
  const { data, isPending, isError } = useQuery({
    queryKey: ['users', id],
    queryFn: () =>
      fetch(`https://jsonplaceholder.typicode.com/users/${id}`).then((r) => {
        // ném lỗi để Query biết đây là lỗi fetch, tự retry
        if (!r.ok) throw new Error('Fetch failed');
        return r.json();
      }),
  });
  // selector chọn đúng 1 action cần — thay đổi field khác không re-render UserCard
  const toggle = useUi((s) => s.toggle);
  if (isPending) return <p>Đang tải…</p>;   // lần đầu chưa có cache
  if (isError) return <p>Lỗi tải user.</p>;
  return (
    <div>
      <h3>{data.name}</h3>
      <button onClick={toggle}>Đóng/mở sidebar</button>
    </div>
  );
}
```

## Giải thích từng phần
- `create<Ui>()((set) => ...)`: cặp `()` thứ hai là bắt buộc với TypeScript để suy luận kiểu curried — đây là cú pháp chuẩn Zustand v5.
- `set((s) => ({...}))`: cập nhật immutable bằng object mới; không mutate state cũ (Zustand không "deep compare", nó so sánh tham chiếu → mutate gây mất re-render).
- `useUi((s) => s.toggle)`: chọn đúng action; nếu viết `useUi()` không selector, component sẽ re-render mỗi lần *bất kỳ* field nào đổi.
- `useQuery` tự động: retry khi lỗi, cache giữa các lần mount, refetchOnWindowFocus mặc định (tắt nếu không muốn tốn request).
- `isPending` chỉ đúng khi **chưa có dữ liệu**; khi đã có cache và refetch nền, ta có `isFetching` để hiện tín hiệu nhẹ (spinner con) không đè trắng màn hình.

## So sánh (nếu có)
- **State thủ công (useState + useEffect fetch) vs Zustand + TanStack Query**: thủ công phải tự làm 5 việc Query đã có sẵn — track pending/error, retry, dedupe request trùng, cache giữa lần visit, đồng bộ focus. Query code gọn hơn ~60% và đúng hơn ở biên (lỗi mạng, thoát nhanh).
- **Lưu hết vào Zustand vs tách server/client state**: lưu server data vào Zustand → mất cache theo key, mất staleTime, mất tự động refetch, và mỗi lần đổi phải sửa luồng setState tay. Tách ra → ít code hơn, dữ liệu luôn khớp server.
- **TanStack Query vs SWR**: cùng ý tưởng cache-first; Query mạnh hơn về mutation, optimistic update, infinite query, devtools; SWR gọn nhẹ hơn cho nhu cầu đơn giản.

## Lỗi thường gặp / Chống chỉ định
- **Copy server data vào Zustand rồi sửa 2 nơi** → desync và re-render dư. Fix: chỉ giữ server data trong Query; muốn tạm sửa local thì dùng `useMutation` + optimistic update.
- **`queryKey` thiếu param** (ví dụ `['users']` cho mọi id) → mỗi user ghi đè cache của user khác, UI nhảy data. Fix: đưa toàn bộ tham số xác định dữ liệu vào key: `['users', id]`.
- **Trả dữ liệu mới tạo mỗi lần gọi `queryFn`** (array concat) → vòng lặp vô hạn re-render. Fix: trả reference ổn định từ server, hoặc `select` với cache.
- **Gọi `invalidates` quá rộng hoặc quá narrow** → refetch thừa hoặc sót. Fix: invalidate đúng cây key, dùng `predicate`/`exact` khi cần.
- **Chống chỉ định**: app chủ yếu là form client-side, chưa có API — TanStack Query sẽ là một lớp thừa (nhưng Zustand vẫn hữu ích); realtime feed cần WebSocket hơn là polling tay — hãy để Query + socket đồng bộ qua `setQueryData`.

## Câu hỏi thường gặp
- **Khi nào dùng Zustand thay Query?** State thuộc về phiên UI (sidebar, modal, filter tạm, cart nháp) → Zustand; state phản chiếu server (danh sách, chi tiết) → Query.
- **`staleTime` khác `gcTime` thế nào?** `staleTime` = bao lâu coi data còn tươi (không refetch); `gcTime` = bao lâu giữ cache sau khi component cuối unmount trước khi xoá.
- **Có cần Redux không?** Với hầu hết app 2026, không — Zustand + Query phủ được; Redux Toolkit vẫn hợp với team cần event-sourcing/undo phức tạp.
- **Query có thay cho form state không?** Không; form local state vẫn dùng `useState`/react-hook-form; chỉ dùng Query cho dữ liệu server sau khi submit/mutate.
- **Làm sao tránh gọi API trùng khi nhiều component cùng query?** TanStack Query tự **dedupe** request theo `queryKey` trong cùng khung thời gian — chỉ cần dùng chung key.

## Ghi chú 2026
- TanStack Query v5 đổi `isLoading` → `isPending` cho lần tải đầu, thêm `isInitialLoading`/`isFetching` phân biệt rõ trạng thái.
- Zustand v5 yêu cầu cú pháp curried `create<T>()(...)`; dùng `useShallow` cho selector nhiều field.
- Kết hợp với React Compiler: selector và query options vẫn nên ổn định tham chiếu để tránh fetch dư.

## Best practices / Mẹo
- Đặt `staleTime` mặc định ở provider (~30s), chỉ override khi data hiếm đổi hoặc cần tươi.
- `useShallow` cho selector nhiều field; tách store lớn thành **slice** (`create<State>()((...set) => ({...uiSlice, ...cartSlice}))`).
- Dùng `partialize` trong `persist` để không lưu action/functions, token nhạy cảm.
- Thử nghiệm **optimistic update**: `onMutate` set dữ liệu giả lập, `onError` rollback từ snapshot — UX cảm giác instant.
- Cài React Query Devtools + Zustand `devtools` middleware khi dev để xem cache & state.
- Tách **query keys** thành factory (`userKeys.detail(id)`) để tránh lệch chuỗi và dễ invalidate có kiểm soát.
- Đặt `retry` hợp lý: mặc định 3 lần; tắt (`retry: false`) cho mutation/OTP để không gửi trùng.
- Với dữ liệu realtime, dùng `queryClient.setQueryData` từ WebSocket thay vì polling — cache vẫn là nguồn sự thật phía client.
- Với dữ liệu nhạy cảm, dùng `persist` có `storage` tùy biến (sessionStorage/IndexedDB) thay localStorage.
- Bật `refetchOnReconnect` để đồng bộ lại khi mạng hồi — mặc định đã bật, đừng tắt nhầm.
- Dùng `queryClient.prefetchQuery` khi hover link để data sẵn sàng trước điều hướng.
- Tách query key factory (`userKeys.all`/`userKeys.detail`) để tránh lệch chuỗi khi invalidate.

## Bài tập nhỏ
Tạo store `useCart` (Zustand + persist) cho giỏ hàng, và danh sách sản phẩm từ API bằng `useQuery(['products'])`. Nút "Thêm vào giỏ" gọi `useMutation` cập nhật server cart, sau đó `invalidateQueries(['cart'])`. Bấm nút ở tab thứ hai → xem dữ liệu tự đồng bộ (refetchOnWindowFocus). Kiểm tra trong DevTools: queryDedupe khi 2 component cùng query một key.

## Reference
- [Zustand](https://zustand.docs.pmnd.rs/)
- [TanStack Query](https://tanstack.com/query/latest)
- [TanStack Query — mutations/invalidations](https://tanstack.com/query/latest/docs/framework/react/guides/mutations)