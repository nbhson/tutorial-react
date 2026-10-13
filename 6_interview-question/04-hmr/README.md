# Q4: Em đang sửa code, lưu phát UI cập nhật mà state không mất — cơ chế đó là gì, khác gì F5?

## Câu hỏi

> Lưu file xong mà UI tự cập nhật, state không mất — HMR làm được điều đó như thế nào?
> So với F5 (full reload) thì khác chỗ nào? React + Vite so với Next.js thì có khác nhau không?

## Trả lời ngắn (elevator pitch, 30 giây)
- **HMR**: lưu file thì dev server chỉ thay đúng module vừa sửa, app đang chạy giữ nguyên state. Form nhập dở thì nhập tiếp luôn, không mất chữ.
- **F5**: chạy lại từ đầu — mất hết state, tải lại cả bundle nên chậm.
- **Không phải lúc nào cũng HMR được**: sửa config hoặc phá quy tắc hook thì dev server tự reload cả trang (fallback). Thấy mất state sau khi lưu thì hiểu là rơi vào trường hợp này.

## Trả lời chi tiết

### 1. Full reload: cơ chế "an toàn nhưng chậm"

- F5 → browser **gỡ** DOM/JS context, **tải** lại HTML, **parse & execute** lại toàn bộ JS từ đầu.
- Chi phí: O(toàn bộ bundle). App 500KB JS → execute lại 500KB, tất cả module chạy lại, React mount lại từ `createRoot` → **mất state**.
- **Ưu điểm**: "sạch tuyệt đối" — không có module nào ở trạng thái cũ/leak; mọi code chạy đúng như mới open app.

### 2. HMR: thay module "giữ" state

Cơ chế (Vite/Webpack):

1. Bạn sửa file, dev server **compile lại chỉ module đó** (Vite: esbuild transform 1 file; Webpack: incremental build).
2. Server gửi **update qua WebSocket**: "module X phiên bản mới đây".
3. Browser **replace** module X trong module graph hiện có (không đụng DOM/entry, không chạy lại toàn bộ app).
4. Nếu module X là **React component** (HMR-aware, nhờ `vite-plugin-react` / React Refresh): React **giữ state** của component đó và các con, chỉ re-render phần giao diện; router/Context không mất.
5. Nếu module X **không HMR-aware** (ví dụ `utils/date.ts`, hoặc sửa hook sai quy tắc) → HMR **không** biết cách "gộp" → **escalate lên full reload** (hoặc reload subtree).

```tsx
// vite.config.ts (vite-plugin-react)
// Vite + React HMR = "Fast Refresh": React component được thay
// mà không mất state (giữ state qua component boundary).
// Nếu component bị sửa "vượt boundary" (số hook đổi, export đổi) →
// Fast Refresh "không an toàn" → escalate full reload.
```

### 3. So sánh bảng (góc nhìn phỏng vấn)

| Tiêu chí | Full reload (F5) | HMR (Vite + React) |
|---|---|---|
| **State React** (useState, Context, router) | **Mất** | **Giữ** (component-level) |
| **Time-to-feedback** | Chậm (reload + execute toàn bộ) | Nhanh (chỉ diff module) |
| **Module chạy lại** | Toàn bộ (entry → leaf) | Chỉ module bị sửa + phần bị ảnh hưởng |
| **Khi nào dùng** | Bug "không reproduce" ở HMR, sau đổi `vite.config`, sau đổi dependency | **Dev loop thường nhật** |
| **Limitation** | Không có — luôn "sạch" | "Boundary" giới hạn; có thể silent bug nếu không escalate đúng |
| **React cụ thể** | — | `vite-plugin-react` dùng **React Refresh** (runtime + compiler) |

### 4. Tại sao HMR quan trọng (đây là phần "ăn điểm")

Không chỉ "nhanh hơn" — HMR cho phép **dev loop lặp lại** với cùng state: bạn đang sửa CSS của component `Cart`, bạn **giữ item đã add trong cart** để xem thay đổi giao diện ở *trạng thái đầy đủ* — full reload thì mỗi lần sửa phải "xây lại" state từ đầu (click, fill form...). Đây là lý do HMR là **chuẩn** của mọi dev tool hiện đại (Vite, Webpack, Next.js) — không chỉ React.

### 5. HMR React 19 + Compiler: có gì mới?

- **React Refresh** (runtime phía dưới) hỗ trợ: giữ state qua component boundary, "hoàn nguyên" (revert) state khi cần (ví dụ component bị "giảm" hook count).
- **React Compiler (1.0)** + HMR: compiler **auto-memo** giúp React Refresh "biết" boundary nào là an toàn (stable component) → HMR ít escalate full reload hơn, đặc biệt khi dùng `<memo>`, `useCallback`.
- **Lưu ý**: HMR/React Refresh là **dev-only**; production build không có (báo "React-Refresh only works in dev" nếu thấy).

### 6. Case thực tế: "HMR không hoạt động, state bị mất"

Nguyên nhân thường gặp (đặt vào phần "Lỗi thường gặp"):

1. **Sửa file ở "out of scope"**: `vite.config.ts`, `.env`, dependency (package node_modules) → dev server **restart** (Vite) hoặc **full reload**, không phải HMR.
2. **Đổi số lượng hook / cấu trúc component** (ví dụ thêm `useState` mới không có cleanup) → React Refresh "không an toàn" → **escalate** (mất state).
3. **Module có "top-level side effect" nặng** (khi import đã `Math.random()`, `new WebSocket()`) → HMR giữ module cũ → **bug silent** (state cũ không cleanup).
4. **Framework-specific** (Next.js, React Router v7) → HMR "khác": Next dùng **`react-refresh` + router-aware custom pipeline**, không phải `vite-plugin-react` nguyên chất — hành vi boundary khác (ví dụ Next HMR giữ router state nhưng reset phần không được bảo vệ).

## Bẫy khi phỏng vấn

1. **"HMR = giữ state"** (suông) → **không chính xác**: giữ state **ở component boundary** (React Fast Refresh), không giữ state **global** (ví dụ Context ở "trên" boundary bị sửa có thể reset). Nên nói: "keep **component** state, re-run phần không được bảo vệ".
2. **Nhầm HMR với "HMR = không bao giờ reload"** → sai: HMR có **escalation rule** (không an toàn → full reload; dev server thay đổi config → server restart).
3. **"HMR là của Vite"** → Vite *cung cấp* HMR (module graph + WebSocket), nhưng **React-specific** HMR = **React Refresh** (runtime). Webpack cũng HMR (đơn vị là "module chunk"), Next.js cũng HMR (unit-level + router-aware).
4. **Đánh giá HMR theo "tốc độ dev server"** (Vite cold start nhanh) → HMR = **nhiều lần** thay đổi nhỏ **mỗi lần**; "cold start" (lần đầu) là **chuyện khác** (Vite win bằng không cần pre-bundle).

## Gợi ý câu chốt

> "HMR là 'thay module, không thay app': sửa file → dev server gửi diff → React Fast Refresh giữ state **tại boundary component**, chỉ re-render phần đổi. Full reload thì `createRoot` chạy lại từ đầu, state mất. HMR không phải 'miễn phí' — nó có rule: nếu thay đổi không an toàn (thiếu cleanup, đổi hook, sửa config) thì **escalate full reload** (hoặc server restart). Hiểu rõ boundary này là cách debug 'HMR không hoạt động' nhanh nhất."

## Reference

- Vite HMR — [vitejs.dev/guide/features.html#hot-module-replacement](https://vitejs.dev/guide/features.html)
- React Refresh (vite-plugin-react) — [vitejs.dev/react.html](https://vitejs.dev/react.html)
- Next.js HMR behavior — [nextjs.org/docs/app/building-your-application/next-internals](https://nextjs.org/docs/app/building-your-app/next-internals)
- Q3 (StrictMode) — double-invoke ở dev, tương quan "dev-only" tooling
- [`2_react-techniques/6_dev-tools/1-vite`](../../2_react-techniques/6_dev-tools/1-vite) — Vite dev server + HMR trong tutorial

## Câu hỏi liên quan

- **Hỏi tiếp (liên tục)**: [Q3 — StrictMode?](../03-strictmode/README.md) · [Q2 — React 18 vs 19?](../02-react-18-vs-19/README.md)
- **Đào sâu (xuyên nhóm)**: [Q23 — build ra bundle quá to thì giảm bằng gì?](../23-bundle-size/README.md)
