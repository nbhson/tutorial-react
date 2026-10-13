# Q43: Em đã bao giờ phải nâng ứng dụng lên version mới chưa, ví dụ app đang ở 18 mà có yêu cầu lên 19?

## Câu hỏi

> Em đã bao giờ có yêu cầu phải nâng ứng dụng lên version mới hơn chưa, ví dụ app đang ở version 18 nhưng có yêu cầu nâng lên 19?
> Lúc đó em làm theo các bước nào, và theo em chỗ nào dễ vỡ nhất?

## Trả lời ngắn (elevator pitch, 30 giây)

- **Nguyên tắc: đi từng nấc 17 → 18 → 19, không nhảy cóc** — mỗi nấc có một breaking change bắt buộc, sửa xong nấc đó, test xanh rồi mới lên tiếp. Chạy codemod của team React trước khi sửa tay.
- **3 điểm vỡ theo nấc**: (1) **17 → 18**: `ReactDOM.render` bắt buộc đổi sang `createRoot` — không đổi thì concurrent/batching không chạy. (2) **Lên 18**: auto-batching + StrictMode double-effect lộ bug cũ (effect fetch 2 lần, subscription rò rỉ). (3) **18 → 19**: dọn API deprecated — string ref, `defaultProps` cho function component, `forwardRef` không còn bắt buộc (`ref` thành prop thường).
- **Điểm ăn điểm**: "StrictMode là radar migration" — bật StrictMode ở dev, chỗ nào double-invoke mà sai là chỗ đó sẽ vỡ ở bản mới. Sửa cho StrictMode xanh trước khi nâng version thật.

## Trả lời chi tiết

### 1. Checklist trước khi động vào version

1. **Khoanh vùng API cũ**: tìm `ReactDOM.render`, `ReactDOM.hydrate`, string ref (`ref="name"`), `findDOMNode`, `defaultProps` trên function component, `UNSAFE_*` lifecycle. Đây là danh sách vỡ chắc chắn ở 19.
2. **Đo nền**: test e2e/smoke của flow chính phải xanh ở version hiện tại — nếu nền đã đỏ thì migration xong không biết đỏ do đâu.
3. **Bật StrictMode ở dev** (nếu chưa bật): double-render/double-effect sẽ lộ bug latent — sửa hết warning trước, vì bản mới siết chặt đúng những chỗ này.

### 2. Nấc 17 → 18: đổi root, nhận batching

```tsx
// ❌ 17: API cũ — lên 18 vẫn chạy nhưng mất concurrent + warning
import ReactDOM from "react-dom";
ReactDOM.render(<App />, document.getElementById("root"));

// ✅ 18+: root mới là bắt buộc
import { createRoot } from "react-dom/client";
createRoot(document.getElementById("root")!).render(<App />);
```

- **Auto-batching**: `setState` trong Promise/timeout giờ gộp thành 1 render (trước đây mỗi cái 1 render). UI ít render hơn — nhưng code nào đếm số lần render hoặc đọc DOM ngay sau `setState` trong timeout sẽ thấy khác.
- **StrictMode double-effect ở dev**: effect chạy mount → cleanup → mount lại. Effect không có cleanup đúng (fetch không abort, subscription không unsubscribe) sẽ lộ ngay — sửa bằng cleanup chuẩn, không tắt StrictMode để "cho qua".

### 3. Nấc 18 → 19: dọn deprecated, nhận API mới

| Đổi gì | Trước (18 chạy, 19 vỡ/bỏ) | Sau (19) |
|---|---|---|
| Root API | `ReactDOM.render` | `createRoot(...).render` (đã đổi ở nấc 18) |
| String ref | `ref="myInput"` | `useRef` + `ref={myRef}` |
| `defaultProps` (function) | `Comp.defaultProps = {...}` | Default parameter `function Comp({ a = 1 })` |
| `forwardRef` | Bắt buộc để nhận ref | Không cần — `ref` là prop thường: `function Input({ ref })` |
| `findDOMNode` / `UNSAFE_*` | Warning | Bỏ hẳn |

Chạy codemod trước, sửa tay phần còn lại:

```bash
npx codemod@latest react/19/migration-recipe
```

- Sau codemod vẫn phải review tay: codemod đổi cú pháp, không sửa được logic (ví dụ effect thiếu cleanup, ref type sai).
- API mới (Actions, `use()`, `useOptimistic`) là **cộng thêm, không bắt buộc** — migration xong app chạy đã, rồi mới refactor từng form sang Actions sau (xem Q2).

### 4. Chiến lược triển khai an toàn

1. **Từng nấc một commit riêng**: 17→18 (root + batching) merge trước, chạy production một thời gian, rồi mới 18→19.
2. **Codemod trước, tay sau**: codemod lo 80% cú pháp máy móc; sức người dành cho 20% logic (effect, ref, test).
3. **Canary + rollback**: deploy bản mới cho % traffic nhỏ, soi error rate + Web Vitals; version React rollback được như mọi deploy — không cần feature flag riêng cho version.
4. **Không refactor nghiệp vụ trong cùng PR migration**: PR nâng version chỉ đổi version + fix vỡ. Viết lại form sang Actions hay đổi state management là PR khác.

## Bẫy khi phỏng vấn

1. **"Nhảy thẳng 17 → 19 cho nhanh"** → **sai**: mỗi nấc có breaking change riêng, gộp lại không biết vỡ do đâu. Đi từng nấc, test xanh từng nấc.
2. **"Chạy codemod là xong"** → **sai**: codemod chỉ đổi cú pháp, không sửa logic (effect thiếu cleanup, batching đổi hành vi đọc state). Phải review + test.
3. **"Tắt StrictMode vì nó render 2 lần gây phiền"** → **sai nặng**: StrictMode chính là radar báo trước chỗ sẽ vỡ ở bản mới. Tắt là bịt mắt.
4. **"Migration xong là refactor luôn sang API mới cho bõ"** → **sai**: trộn migration + refactor vào một PR thì khi lỗi không biết do version hay do code mới. Tách riêng.
5. **"`ReactDOM.render` lên 19 vẫn chạy vì React tương thích ngược"** → **sai**: 19 bỏ hẳn, phải `createRoot` từ nấc 18.

## Gợi ý câu chốt

> "Migration React em đi **17 → 18 → 19 từng nấc**: trước hết khoanh API cũ (render cũ, string ref, defaultProps, findDOMNode) + bật StrictMode cho xanh + test nền xanh. Nấc 18 đổi **createRoot**, sửa effect lộ do double-invoke và batching mới. Nấc 19 chạy **codemod**, dọn deprecated (ref là prop thường, bỏ forwardRef/defaultProps). Mỗi nấc một PR, deploy canary, không trộn refactor nghiệp vụ vào. StrictMode xanh ở dev là tín hiệu lên version an toàn."

## Reference

- [React 18 Upgrade Guide](https://react.dev/blog/2022/03/29/react-18-upgrade-guide) — `createRoot`, batching, StrictMode
- [React 19 Upgrade Guide](https://react.dev/blog/2024/12/05/react-19-upgrade-guide) — deprecated bị bỏ, codemod
- [codemod React 19 recipe](https://codemod.com/registry/react-19-migration-recipe) — chạy tự động trước khi sửa tay

## Câu hỏi liên quan

- **Hỏi tiếp (liên tục)**: [Q2 — 19 khác 18 lớn nhất ở đâu?](../02-react-18-vs-19/README.md) · [Q3 — StrictMode báo gì khi migrate?](../03-strictmode/README.md)
- **Đào sâu (xuyên nhóm)**: [Q26 — batching đổi hành vi gì ở 18?](../26-batching-stale-closure/README.md) · [Q23 — bundle sau nâng có phình không?](../23-bundle-size/README.md)
