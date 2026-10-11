# DAY 12 — Hỏi & Đáp: Data fetching

> File hỏi–đáp chi tiết cho `3_react-tutorial/12-data-fetching`.
> Đọc kèm: `README.md` (lý thuyết) + `example.tsx` (fetch + AbortController chạy được).

---

## 1. Vì sao `fetch` phải check `!r.ok` tay? `catch` không bắt được 404 à?

**Hỏi:** `fetch(...).catch(...)` không đủ à?

**Đáp:**
- **Không đủ.** `fetch` chỉ reject khi **lỗi mạng** (mất mạng, CORS, abort). HTTP 404/500 vẫn **resolve**
  bình thường — nên phải `if (!r.ok) throw new Error(...)` tay, nếu không 404 hiện `[]` thay vì lỗi.
- Đây là lỗi #1 của người mới: `.catch` chỉ bắt mạng/abort, còn lỗi HTTP phải check status.

---

## 2. `AbortController` để làm gì? Bỏ được không?

**Hỏi:** Example tạo `AbortController` rồi cleanup `abort()` — rườm rà quá?

**Đáp:**
- Để **hủy request khi unmount/đổi deps**: user rời trang trước khi response về → không `setState`
  vào component đã unmount (warning + request thừa).
- Không bỏ được — nhất là dev có StrictMode mount 2 lần: effect đầu bị abort là **bình thường**,
  `.catch` phải bỏ qua `AbortError` (hủy chủ đích, không phải lỗi để hiện UI).

```tsx
useEffect(() => {
  const ctrl = new AbortController();
  fetch(url, { signal: ctrl.signal }).then(...).catch((e) => {
    if (e.name !== "AbortError") setError(String(e));
  });
  return () => ctrl.abort();
}, []);
```

---

## 3. TanStack Query thay thế được gì của fetch tay?

**Hỏi:** `useQuery` hơn gì `useEffect` + 3 state `data/loading/error`?

**Đáp:**
- Fetch tay mỗi component tự lo: cache, retry, dedupe, refetch, stale — viết đủ rất dễ sai.
  `useQuery({ queryKey, queryFn })` cho sẵn tất cả: cùng `queryKey` ở 2 component → **1 request duy nhất**
  (dedupe), remount trong `staleTime` không refetch, focus tab refetch nền, `retry` khai báo.
- Quy tắc 2026: **manual để học cơ chế, prod dùng managed fetching**. `queryFn` phải throw khi HTTP lỗi
  (đừng trả `null` che lỗi) để Query retry/`isError` đúng.
- Đừng quên bọc `<QueryClientProvider>` ở root và tạo `QueryClient` **một lần** ở module (tạo mỗi render là mất cache).

---

## 4. `staleTime` vs `gcTime` khác nhau thế nào?

**Hỏi:** Hai con số này đều về "giữ dữ liệu", phân biệt sao?

**Đáp:**
- `staleTime` (vd 30s): dữ liệu "tươi" bao lâu — trong hạn remount **không refetch**; quá hạn thì hiện cache cũ
  ngay + refetch nền (không màn loading).
- `gcTime` (mặc định 5 phút): giữ cache bao lâu **sau unmount** — quay lại trang trong hạn là có data tức thì.
- Nhớ: stale = có refetch không; gc = có còn giữ không.

---

## 5. Mutation (POST/PUT/DELETE) viết ở đâu? Sao list tự cập nhật?

**Hỏi:** Thêm/xóa xong phải fetch lại tay à?

**Đáp:**
- Dùng `useMutation` + `onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] })` —
  Query tự refetch danh sách, không cần `setState` tay hay refetch thủ công.
- Muốn UX nhanh hơn: **optimistic update** (`onMutate` vá cache trước, `onError` rollback) — nhanh nhưng phải cẩn thận.

---

## 6. `use()` + Suspense và Server Components liên quan gì?

**Hỏi:** Ba khái niệm này đi với nhau thế nào?

**Đáp:**
- `use(promise)` đọc Promise **trực tiếp trong render** — component suspend tới khi resolve,
  `<Suspense fallback>` hiện trong lúc chờ. Dành cho framework (Next.js) hoặc promise có sẵn.
- **Server Components** (stable 2026, qua Next.js): fetch **trực tiếp trên server** bằng `async function`,
  không cần effect — SPA Vite thuần không dùng, chuẩn là TanStack Query.

---

## 7. Server state và client state để chung được không?

**Hỏi:** Nhét `users` từ API vào Zustand store luôn cho tiện?

**Đáp:**
- **Không.** Server state (users, products — có cache/retry/dedupe) → TanStack Query.
  Client state sinh từ nó (cart, filter, toggle) → Zustand/Context. Trộn là mất hết lợi ích cache
  của Query mà store cũng không có sẵn.

---

## 8. So nhanh Angular `HttpClient` ↔ React fetching?

**Hỏi:** Từng khái niệm HttpClient tương đương gì?

**Đáp:**

| Angular | React | Ghi chú |
|---|---|---|
| `HttpClient.get` (Observable) | `fetch` (Promise) / axios / ky | Stream ↔ promise |
| Interceptor | wrapper fetch / axios instance | Tự viết tầng giữa |
| RxJS `retry`/`catchError` | options `retry`/`retryDelay` | Khai báo, không viết tay |
| Cache hiếm khi dùng | `useQuery` cache + dedupe | Mạnh hơn hẳn |
| Guard + resolver | router loader (DAY 14) / query | Data trước route |

---

## Reference

- `README.md` + `example.tsx` trong cùng thư mục (DAY 12)
- https://tanstack.com/query/latest
- https://react.dev/reference/react/use · https://react.dev/reference/react/useEffect
