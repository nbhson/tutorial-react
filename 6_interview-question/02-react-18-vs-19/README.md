# Q2: React 18 với 19 khác nhau chỗ nào? Sao 19 được gọi là bản bước ngoặt?

## Câu hỏi

> Nâng app từ React 18 lên 19 thì phải thay đổi những gì?
> Vì sao 19 được gọi là bản bước ngoặt — nó giải quyết được điều gì mà 18 chưa làm được?
## Trả lời ngắn (elevator pitch, 30 giây)

Mục này là bản "30 giây chinh phục interviewer" — ba gạch đầu dòng đủ để trả lời trọn câu hỏi mà không cần mở gì thêm.

- **React 18 giải quyết "UI đứng hình"**: trước đây update nặng (lọc 10.000 dòng) thì cả trang khựng vì lần vẽ chặn main thread. 18 cho vẽ ngắt được/ưu tiên được, gộp nhiều `setState` thành một lần vẽ (batching), và đánh dấu update "không gấp" (transition). Đổi duy nhất bắt buộc: `createRoot` thay `ReactDOM.render`.
- **React 19 giải quyết "viết form cực"**: submit + pending + lỗi + hiện trước (optimistic) trước đây tự quản bằng `useState` rất lằng nhằng. 19 cho `<form action>` + `useActionState` (pending/error có sẵn), `useOptimistic` (hiện ngay, lỗi tự rollback), `ref` thành prop thường (bỏ `forwardRef`), viết `<title>` thẳng trong component.
- **Một câu chốt**: 18 làm UI mượt, 19 làm code gọn. Ví von: 18 là "làm cho con ngựa chạy bền", 19 là "trao yên cương gọn gàng cho người cưỡi". Nâng 18 lên 19 gần như suôn sẻ, chỉ cần dọn API đã báo deprecated từ trước (string ref, `defaultProps`, `ReactDOM.render`).

> **Tóm gọn 1 câu:** 18 sửa cách render (concurrent), 19 sửa cách viết (Actions, ref-as-prop, metadata) — nâng cấp chủ yếu là dọn API đã báo trước.

## Trả lời chi tiết

### 1. Context: 18 là nền tảng, 19 là lớp ứng dụng

Mục này đặt hai bản vào đúng vị trí của chúng: 18 dựng móng (renderer), 19 xây tầng (API). Hiểu đúng vị trí thì trả lời câu nào cũng trôi chảy.

| | React 18 | React 19 |
|---|---|---|
| Vấn đề lớn | UI block main thread khi update nặng | Form/mutation phải tự quản pending/error; `forwardRef` boilerplate; `<head>` cần thư viện |
| Cách tiếp cận | Kiến trúc lại renderer (concurrent) | Chuẩn hóa API, lấp dần việc trước phải nhờ thư viện |
| Vai trò | Bắt buộc migrate (`createRoot`) — mọi bản sau giả định bạn đã ở 18 | Bước ngoặt form + data flow, tiền đề RSC |

> **Cách đọc bảng này:** đọc ngang từng hàng để thấy "cùng một khía cạnh, hai bản khác nhau ra sao" — hàng "Vai trò" là câu trả lời súc tích nhất cho chữ "bước ngoặt" trong đề bài.

### 2. Feature của riêng React 18 (không có ở 19)

Mục này liệt kê "đồ đạc chỉ có ở 18" — dùng để trả lời khi interviewer hỏi ngược "vậy 18 có gì mà 19 không?".

- **Concurrent Rendering**: render chia 2 phase — *render phase* (tinh khiết, ngắt được) và *commit phase* (nguyên tử). `createRoot` thay `ReactDOM.render`.
- **Automatic Batching**: mọi `setState` trong cùng task (kể cả async) gom thành 1 render; thoát bằng `flushSync`.
- **Transitions & Suspense**: `startTransition`/`useTransition`/`useDeferredValue` đánh dấu update non-urgent; `<Suspense>` streaming SSR.
- **`useId`** (ID tất định, SSR-safe) và **`useSyncExternalStore`** (subscribe store ngoài, không tearing).

### 3. Feature của riêng React 19

> 📄 **Code ví dụ:** [`examples/01-3-feature-cua-rieng-react-19.tsx`](examples/01-3-feature-cua-rieng-react-19.tsx)

### 4. Breaking changes khi nâng 18 → 19

Mục này là "danh sách đồ bị thu hồi" khi nâng cấp — bảng này chính là checklist migration của bạn.

| Thay đổi | Trước 19 | Sau 19 |
|---|---|---|
| Entry point | `ReactDOM.render` (deprecated từ 18) | **bị gỡ** — bắt buộc `createRoot` |
| Expose DOM | `forwardRef` | `ref` là prop thường (không khuyến khích `forwardRef` nữa) |
| Function component | `defaultProps`, `propTypes` | **bị gỡ** → default parameter + TypeScript |
| Ref | String ref `ref="x"` | **bị gỡ** → ref callback / `createRef` |
| DOM access | `ReactDOM.findDOMNode` | **bị gỡ** → ref trực tiếp |
| Ref cleanup | trả `null` | ref callback trả **cleanup function** |

> **Cách đọc bảng này:** đọc theo cột "Trước 19 → Sau 19" như một cặp đổi chì — cứ dò từng hàng xem code của mình còn dùng pattern cột trái không, có thì sửa theo cột phải.

> Điểm hay để nói với interviewer: **hầu hết app React 18 nâng lên 19 gần như suôn sẻ** — chỉ cần dọn các pattern đã deprecate từ 18 (`ReactDOM.render`, `defaultProps`, string ref) và nâng `@types/react` cùng version.

### 5. So sánh "cách làm" cùng một việc

Mục này ghép hai bản cạnh nhau qua 5 công việc thường gặp — thấy ngay 19 "rút gọn" được bao nhiêu dòng code.

| Việc | Kiểu React 18 | Kiểu React 19 |
|---|---|---|
| Submit form + hiện pending | `onSubmit` + `useState(pending/error)` | `<form action>` + `useActionState`/`useFormStatus` |
| Optimistic UI | Tự quản + rollback tay | `useOptimistic` (lỗi tự rollback) |
| Đọc promise trong render | `useEffect` + state, top-level | `use()` — có điều kiện, suspend qua Suspense |
| Component expose DOM node | `forwardRef` | `ref` as prop |
| Đổi `<title>`/`<meta>` | `react-helmet` / `next/head` | Metadata native, hoist + dedupe |

> **Cách đọc bảng này:** cột "Việc" là thứ ai cũng phải làm, cột "Kiểu React 18" là cách rườm rà cũ, cột "Kiểu React 19" là cách mới gọn hơn — dùng làm bằng chứng cho câu "19 làm code gọn".

> **Tóm gọn 1 câu:** 18 dựng nền concurrent, 19 xây tầng ứng dụng gọn gàng phía trên — migration chủ yếu là "dọn nhà" những món đã báo trước.

## Bẫy khi phỏng vấn

Mục này là 4 chỗ "trật luyên" hay gặp nhất khi so sánh 18 vs 19 — né được cả 4 là vượt mặt đa số ứng viên.

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

- **Hỏi tiếp (liên tục)**: [Q43 — nâng app 18 lên 19 theo bước nào, chỗ nào dễ vỡ?](../43-migration/README.md) · [Q1 — library hay framework?](../01-library-vs-framework/README.md) · [Q3 — StrictMode?](../03-strictmode/README.md) · [Q43 — nâng app từ 18 lên 19 thực tế đi những bước nào?](../43-migration/README.md)
- **Đào sâu (xuyên nhóm)**: [Q29 — concurrency: startTransition, useDeferredValue?](../29-concurrency-transition-deferred/README.md) · [Q34 — React 19 ref-as-prop?](../34-ref-callback-n-items/README.md)

> Câu hỏi liên quan thêm: Q2 hỏi "18 khác 19 chỗ nào, vì sao là bước ngoặt" ở tầng **thiết kế/API**. Nếu interviewer vặn sang **thực hành migration** (bắt đầu từ đâu, chỗ nào vỡ, đi từng nấc hay nhảy cóc), thì trả lời bằng Q43 — phần Checklist + Nấc 17→18→19 + codemod + canary. Hai câu nối tiếp tự nhiên: "đã biết 19 khác 18 ở đâu → giờ phải nâng 18 lên 19 thì em đi các bước nào?"
