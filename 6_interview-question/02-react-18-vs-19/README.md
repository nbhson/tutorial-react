# Q2: Bạn nâng app từ React 18 lên 19 thì thay đổi gì, vì sao 19 được gọi là bản bước ngoặt?

## Câu hỏi

> Nếu nâng app từ React 18 lên React 19, bạn sẽ đụng phải những thay đổi gì?
> Vì sao 19 được coi là version 'bước ngoặt' — nó giải quyết được vấn đề gì mà 18 chưa giải quyết được?
## Trả lời ngắn (elevator pitch, 30 giây)

- **React 18 (03/2022)** đặt **nền concurrent**: `createRoot`, concurrent renderer (có thể tạm dừng/ưu tiên/hủy render), automatic batching, transitions (`useTransition`/`useDeferredValue`), `useId`, `useSyncExternalStore`.
- **React 19 (12/2024)** xây **API tầng ứng dụng** trên nền đó: **Actions** (`action` prop, `useActionState`, `useOptimistic`, `useFormStatus`), **`use()`** đọc Promise/Context có điều kiện, **`ref` là prop thường** (bỏ `forwardRef`), **Document Metadata** native, **Context-as-provider** (`<Ctx value>`).
- Một câu chốt: **18 giải quyết "UI đứng hình khi render nặng", 19 giải quyết "boilerplate form/mutation/head metadata"**.
- 19 còn là bản major đầu tiên sau 3 năm và là **tiền đề của RSC** (Server Actions chạy cả khi chưa hydrate).

## Trả lời chi tiết

### 1. Context: 18 là nền tảng, 19 là lớp ứng dụng

| | React 18 | React 19 |
|---|---|---|
| Vấn đề lớn | UI block main thread khi update nặng | Form/mutation phải tự quản pending/error; `forwardRef` boilerplate; `<head>` cần thư viện |
| Cách tiếp cận | Kiến trúc lại renderer (concurrent) | Chuẩn hóa API, lấp dần việc trước phải nhờ thư viện |
| Vai trò | Bắt buộc migrate (`createRoot`) — mọi bản sau giả định bạn đã ở 18 | Bước ngoặt form + data flow, tiền đề RSC |

### 2. Feature của riêng React 18 (không có ở 19)

- **Concurrent Rendering**: render chia 2 phase — *render phase* (tinh khiết, ngắt được) và *commit phase* (nguyên tử). `createRoot` thay `ReactDOM.render`.
- **Automatic Batching**: mọi `setState` trong cùng task (kể cả async) gom thành 1 render; thoát bằng `flushSync`.
- **Transitions & Suspense**: `startTransition`/`useTransition`/`useDeferredValue` đánh dấu update non-urgent; `<Suspense>` streaming SSR.
- **`useId`** (ID tất định, SSR-safe) và **`useSyncExternalStore`** (subscribe store ngoài, không tearing).

### 3. Feature của riêng React 19

```tsx
// 1) Actions + form: <form action> thay boilerplate onSubmit + useState pending
const [state, formAction, isPending] = useActionState(action, initial);

// 2) Optimistic UI: hiện ngay, action lỗi → tự rollback
const [optimistic, addOptimistic] = useOptimistic(state, updater);

// 3) use(): đọc Promise (suspend + Suspense) hoặc Context, gọi được TRONG if/vòng lặp
const data = use(userPromise);

// 4) ref as prop: function component nhận ref bình thường — bỏ forwardRef
function Input({ ref, ...p }: { ref?: React.Ref<HTMLInputElement> }) {
  return <input ref={ref} {...p} />; // NHỚ truyền ref xuống element
}

// 5) Document Metadata: <title>/<meta> hoist lên <head>, dedupe
<article><title>Trang A</title><meta name="description" content="..." /></article>

// 6) Context-as-provider (gọn hơn, vẫn chạy song song)
<ThemeContext value="dark">{children}</ThemeContext>
```

### 4. Breaking changes khi nâng 18 → 19

| Thay đổi | Trước 19 | Sau 19 |
|---|---|---|
| Entry point | `ReactDOM.render` (deprecated từ 18) | **bị gỡ** — bắt buộc `createRoot` |
| Expose DOM | `forwardRef` | `ref` là prop thường (không khuyến khích `forwardRef` nữa) |
| Function component | `defaultProps`, `propTypes` | **bị gỡ** → default parameter + TypeScript |
| Ref | String ref `ref="x"` | **bị gỡ** → ref callback / `createRef` |
| DOM access | `ReactDOM.findDOMNode` | **bị gỡ** → ref trực tiếp |
| Ref cleanup | trả `null` | ref callback trả **cleanup function** |

> Điểm hay để nói với interviewer: **hầu hết app React 18 nâng lên 19 gần như suôn sẻ** — chỉ cần dọn các pattern đã deprecate từ 18 (`ReactDOM.render`, `defaultProps`, string ref) và nâng `@types/react` cùng version.

### 5. So sánh "cách làm" cùng một việc

| Việc | Kiểu React 18 | Kiểu React 19 |
|---|---|---|
| Submit form + hiện pending | `onSubmit` + `useState(pending/error)` | `<form action>` + `useActionState`/`useFormStatus` |
| Optimistic UI | Tự quản + rollback tay | `useOptimistic` (lỗi tự rollback) |
| Đọc promise trong render | `useEffect` + state, top-level | `use()` — có điều kiện, suspend qua Suspense |
| Component expose DOM node | `forwardRef` | `ref` as prop |
| Đổi `<title>`/`<meta>` | `react-helmet` / `next/head` | Metadata native, hoist + dedupe |

## Bẫy khi phỏng vấn

1. **Nói 19 = "RSC stable"** mà quên rằng React core chỉ có Actions phía client — Server Actions cần framework (Next.js 15+). Phân biệt rõ "React 19 core" và "RSC ecosystem".
2. **`use()` gọi trong event handler** → hợp lệ chỉ trong render phase; promise tạo trong render gây suspend vô hạn → dùng promise ổn định (module-level/cache/RSC).
3. **Bỏ `forwardRef` mà quên `ref={ref}` ở host element** → `current` null, lỗi rất khó tìm.
4. **Nhầm "18 và 19 khác nhau về architecture"** → thực ra không: 19 KHÔNG thay đổi concurrent renderer, nó chỉ thêm API phía trên. Nền concurrent vẫn của 18.

## Gợi ý câu chốt

> "Nếu tóm gọn: React 18 cho tôi một renderer không đứng hình (concurrent + batching + transitions); React 19 cho tôi bộ API chuẩn để viết form, mutation và metadata mà trước đây phải tự viết hoặc cài thư viện. Nâng từ 18 lên 19 chủ yếu là dọn các API đã deprecate (ReactDOM.render, defaultProps, string ref, forwardRef) — nên chi phí migration thấp nhưng giá trị UX cao."

## Reference

- [React 18 release blog](https://react.dev/blog/2022/03/29/react-18-upgrade-guide) — [`4_react-new-feature/1_react-18`](../../4_react-new-feature/1_react-18)
- [React 19 release blog](https://react.dev/blog/2024/12/05/react-19) — [`4_react-new-feature/2_react-19`](../../4_react-new-feature/2_react-19)
- Q1 (library vs framework) — [`01-library-vs-framework`](../01-library-vs-framework/README.md)

## Câu hỏi liên quan

- **Hỏi tiếp (liên tục)**: [Q1 — library hay framework?](../01-library-vs-framework/README.md) · [Q3 — StrictMode?](../03-strictmode/README.md) · [Q4 — HMR?](../04-hmr/README.md)
- **Đào sâu (xuyên nhóm)**: [Q29 — concurrency: startTransition, useDeferredValue?](../29-concurrency-transition-deferred/README.md) · [Q34 — React 19 ref-as-prop?](../34-ref-callback-n-items/README.md)
