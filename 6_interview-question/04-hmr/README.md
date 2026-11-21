# Q4: Em đang sửa code, lưu phát UI cập nhật mà state không mất — cơ chế đó là gì, khác gì F5?

## Câu hỏi

> Lưu file xong mà UI tự cập nhật, state không mất — HMR (Hot Module Replacement) làm được điều đó như thế nào?
> So với F5 (full reload) thì khác chỗ nào? React + Vite so với Next.js thì có khác nhau không?

## Trả lời ngắn (elevator pitch, 30 giây)

Mục này là câu trả lời 30 giây cho cả ba vế: HMR là gì, khác F5 chỗ nào, và giới hạn của nó.

- **HMR (Hot Module Replacement)**: lưu file thì dev server chỉ thay đúng module vừa sửa, app đang chạy giữ nguyên state. Ví von: thay đúng "trang sách bị lỗi" trong cuốn sách đang mở, thay vì in lại cả cuốn. Form nhập dở thì nhập tiếp luôn, không mất chữ.
- **F5**: chạy lại từ đầu — mất hết state, tải lại cả bundle nên chậm.
- **Không phải lúc nào cũng HMR (Hot Module Replacement) được**: sửa config hoặc phá quy tắc hook thì dev server tự reload cả trang (fallback). Thấy mất state sau khi lưu thì hiểu là rơi vào trường hợp này.

> **Tóm gọn 1 câu:** HMR = "thay module, giữ app" — nhanh và giữ state, nhưng thay đổi không an toàn thì tự escalate thành reload.

## Trả lời chi tiết

### 1. Full reload: cơ chế "an toàn nhưng chậm"

- F5 → browser **gỡ** DOM/JS context, **tải** lại HTML, **parse & execute** lại toàn bộ JS từ đầu.
- Chi phí: O(toàn bộ bundle). App 500KB JS → execute lại 500KB, tất cả module chạy lại, React mount lại từ `createRoot` → **mất state**.
- **Ưu điểm**: "sạch tuyệt đối" — không có module nào ở trạng thái cũ/leak; mọi code chạy đúng như mới open app.

### 2. HMR (Hot Module Replacement): thay module "giữ" state

Mục này là trái tim của câu trả lời: 5 bước HMR xử lý một lần lưu file. Đọc theo thứ tự để kể lại được như một câu chuyện.

Cơ chế (Vite/Webpack):

1. Bạn sửa file, dev server **compile lại chỉ module đó** (Vite: esbuild transform 1 file; Webpack: incremental build).
2. Server gửi **update qua WebSocket**: "module X phiên bản mới đây".
3. Browser **replace** module X trong module graph hiện có (không đụng DOM/entry, không chạy lại toàn bộ app).
4. Nếu module X là **React component** (HMR (Hot Module Replacement)-aware, nhờ `vite-plugin-react` / React Refresh): React **giữ state** của component đó và các con, chỉ re-render phần giao diện; router/Context không mất.
5. Nếu module X **không HMR (Hot Module Replacement)-aware** (ví dụ `utils/date.ts`, hoặc sửa hook sai quy tắc) → HMR (Hot Module Replacement) **không** biết cách "gộp" → **escalate lên full reload** (hoặc reload subtree).

> 📄 **Code ví dụ:** [`examples/01-2-hmr-hot-module-replacement-thay-module-giu.tsx`](examples/01-2-hmr-hot-module-replacement-thay-module-giu.tsx)

### 3. So sánh bảng (góc nhìn phỏng vấn)

Mục này bày HMR và F5 cạnh nhau theo 6 tiêu chí — bảng này dùng để trả lời vế "khác gì F5" của đề bài.

| Tiêu chí | Full reload (F5) | HMR (Hot Module Replacement) (Vite + React) |
|---|---|---|
| **State React** (useState, Context, router) | **Mất** | **Giữ** (component-level) |
| **Time-to-feedback** | Chậm (reload + execute toàn bộ) | Nhanh (chỉ diff module) |
| **Module chạy lại** | Toàn bộ (entry → leaf) | Chỉ module bị sửa + phần bị ảnh hưởng |
| **Khi nào dùng** | Bug "không reproduce" ở HMR (Hot Module Replacement), sau đổi `vite.config`, sau đổi dependency | **Dev loop thường nhật** |
| **Limitation** | Không có — luôn "sạch" | "Boundary" giới hạn; có thể silent bug nếu không escalate đúng |
| **React cụ thể** | — | `vite-plugin-react` dùng **React Refresh** (runtime + compiler) |

> **Cách đọc bảng này:** đọc ngang từng hàng là một phép so sánh trực tiếp; hàng "Khi nào dùng" và "Limitation" là hai hàng ăn điểm vì cho thấy bạn hiểu cả hai công cụ đều có chỗ đứng riêng.

### 4. Tại sao HMR (Hot Module Replacement) quan trọng (đây là phần "ăn điểm")

Không chỉ "nhanh hơn" — HMR (Hot Module Replacement) cho phép **dev loop lặp lại** với cùng state: bạn đang sửa CSS của component `Cart`, bạn **giữ item đã add trong cart** để xem thay đổi giao diện ở *trạng thái đầy đủ* — full reload thì mỗi lần sửa phải "xây lại" state từ đầu (click, fill form...). Đây là lý do HMR (Hot Module Replacement) là **chuẩn** của mọi dev tool hiện đại (Vite, Webpack, Next.js) — không chỉ React.

### 5. HMR (Hot Module Replacement) React 19 + Compiler: có gì mới?

- **React Refresh** (runtime phía dưới) hỗ trợ: giữ state qua component boundary, "hoàn nguyên" (revert) state khi cần (ví dụ component bị "giảm" hook count).
- **React Compiler (1.0)** + HMR (Hot Module Replacement): compiler **auto-memo** giúp React Refresh "biết" boundary nào là an toàn (stable component) → HMR (Hot Module Replacement) ít escalate full reload hơn, đặc biệt khi dùng `<memo>`, `useCallback`.
- **Lưu ý**: HMR (Hot Module Replacement)/React Refresh là **dev-only**; production build không có (báo "React-Refresh only works in dev" nếu thấy).

### 6. Vite 8 (rolldown) + Turbopack: HMR nhanh hơn ở tầng nào?

- **Vite 8 (rolldown-based)**: bundler đổi từ esbuild+Rollup sang **Rolldown (Rust)**, còn React Refresh transform chạy bằng **Oxc** qua `@vitejs/plugin-react` v6 (Babel không còn là dependency). Kết quả dev-loop thấy được: transform 1 file nhanh hơn, pre-bundle dependency (cold start) nhanh tới bậc — nhưng **cơ chế HMR không đổi**: vẫn module graph + WebSocket + React Refresh boundary.
- **Next.js (Turbopack dev mặc định từ Next 15/16)**: HMR "unit" là module Turbopack + router-aware; hành vi escalate khác `vite-plugin-react` nhưng cùng nguyên lý — phần không an toàn thì reload.
- **Điểm ăn điểm khi phỏng vấn**: tách bạch 3 lớp — (1) **bundler** gửi update (Rolldown/Turbopack/Webpack), (2) **runtime refresh** (React Refresh) giữ state theo component, (3) **escalation rule** khi đổi vượt boundary. Ba tầng này độc lập — đổi bundler không đổi cơ chế giữ state.

### 7. Checklist debug "HMR mất state / không cập nhật"

Mục này là "kẹp tài liệu" khi HMR hành xử lạ — 5 bước soi theo thứ tự sẽ tìm ra thủ phạm trong phút mốt.

1. File vừa sửa là gì? `*.config.*`, `.env`, file trong `node_modules` → **server restart**, không phải HMR.
2. Đổi số hook / đổi export? → React Refresh escalate — **đúng hành vi**, không phải bug. Lưu trước khi đổi cấu trúc hook.
3. Module có top-level side effect (mở WebSocket, `setInterval` không cleanup) → state cũ "ma" sau HMR — thêm `import.meta.hot.dispose` hoặc chuyển side-effect vào effect.
4. Component export kiểu HOC/higher-order — Refresh bọc wrapper có thể reset state; bọc ở module hoặc đổi sang hàm thường.
5. Production build thấy lỗi "React Refresh only works in dev" → ai đó import plugin dev vào bundle prod — xóa ngay (làm phình + rò runtime).

### 8. HMR API của Vite (không phải React): `import.meta.hot`

React component có React Refresh lo; nhưng file thường (store, plugin, CSS-in-JS runtime) muốn tự quản HMR thì dùng Vite HMR API:

> 📄 **Code ví dụ:** [`examples/02-8-hmr-api-cua-vite-khong-phai-react.ts`](examples/02-8-hmr-api-cua-vite-khong-phai-react.ts)

- `import.meta.hot.accept(cb)` — khai báo "module này tự biết cách cập nhật". Không khai báo thì fallback lên cha → lan tới entry → full reload.
- `import.meta.hot.dispose(cb)` — dọn side-effect (timer, listener, cache) **trước** khi module cũ bị thay; bỏ qua đây là nguồn bug "dữ liệu cũ còn sống sau khi sửa code".
- Redux Toolkit / Zustand v5 có sẵn HMR-aware `import.meta.hot.accept` trong docs — store thay reducer mới mà giữ state, không cần tự viết.

### 9. Từ vựng phỏng vấn cần dùng đúng

Mục này trang bị "bộ từ điển" — 5 thuật ngữ dùng đúng là interviewer lập tức nhận ra bạn hiểu bản chất.

| Thuật ngữ | Nghĩa chính xác |
|---|---|
| **Module graph** | Đồ thị phụ thuộc module; HMR hoạt động trên graph, update lan theo cạnh bị ảnh hưởng |
| **HMR boundary** | Module khai báo "tôi tự xử lý update" (`accept`); không ai nhận thì lan lên tới entry → full reload |
| **React Refresh boundary** | Component được bọc bởi React Refresh runtime — đơn vị giữ state |
| **Escalate** | Update không an toàn → ném lên trên / full reload |
| **HMR invalidate** | Server chủ động báo "module này đã stale" → reload ngay cả khi không sửa file đó |

> **Cách đọc bảng này:** mỗi hàng một thuật ngữ — học thuộc cột trái và diễn đạt lại cột phải bằng lời của mình; dùng đúng 2–3 thuật ngữ trong câu trả lời là điểm cộng lớn.

Nói đúng thuật ngữ giúp trả lời "HMR hoạt động thế nào" không bị rơi vào kiểu trả lời "nó nóng reload, nhanh" — kiểu đó không qua được vòng senior.

### 10. Scenario trả lời mẫu (30 giây)

> "Sửa 1 component → Vite 8 transform lại đúng module đó bằng Oxc, gửi update qua WebSocket; React Refresh thay component trong boundary và giữ state; em đang gõ dở form vẫn thấy style mới mà không mất chữ. Sửa `vite.config.ts` → server restart (không phải HMR). Thêm 1 `useState` mới trong component → đổi hook count, Refresh đánh giá không an toàn → escalate full reload. Ba hành vi đó đều **đúng thiết kế**, khác nhau ở tầng nào quyết định."

Câu này chứng minh bạn hiểu **3 tầng độc lập** (bundler → refresh runtime → escalation rule) thay vì học thuộc một dòng định nghĩa.

### 11. Câu hỏi drill-down sau câu chính

- **"HMR giữ state tới mức nào?"** — tới **component boundary**: state của component và con nó được giữ; state module-level (store tự viết, biến ngoài) không được bảo vệ trừ khi module tự khai báo `import.meta.hot.accept` + dispose đúng.
- **"Sao sửa file store thì mất hết state?"** — store không phải component → không có React Refresh boundary → `accept` fallback lan lên entry → full reload. Giải pháp: dùng HMR-aware middleware của Redux Toolkit/Zustand (mục 8).
- **"Escalate là ai quyết định?"** — React Refresh runtime quyết theo **quy tắc an toàn** (số hook, cấu trúc export), không phải dev server. Dev chỉ thấy kết quả: giữ state, reload subtree, hoặc full reload.
- **"Production có HMR không?"** — không; toàn bộ nhánh này là dev-only, build prod không nhúng React Refresh runtime.

### 12. Case thực tế: "HMR (Hot Module Replacement) không hoạt động, state bị mất"

Nguyên nhân thường gặp (đặt vào phần "Lỗi thường gặp"):

1. **Sửa file ở "out of scope"**: `vite.config.ts`, `.env`, dependency (package node_modules) → dev server **restart** (Vite) hoặc **full reload**, không phải HMR (Hot Module Replacement).
2. **Đổi số lượng hook / cấu trúc component** (ví dụ thêm `useState` mới không có cleanup) → React Refresh "không an toàn" → **escalate** (mất state).
3. **Module có "top-level side effect" nặng** (khi import đã `Math.random()`, `new WebSocket()`) → HMR (Hot Module Replacement) giữ module cũ → **bug silent** (state cũ không cleanup).
4. **Framework-specific** (Next.js, React Router v7) → HMR (Hot Module Replacement) "khác": Next dùng **`react-refresh` + router-aware custom pipeline**, không phải `vite-plugin-react` nguyên chất — hành vi boundary khác (ví dụ Next HMR (Hot Module Replacement) giữ router state nhưng reset phần không được bảo vệ).

## Bẫy khi phỏng vấn

Mục này là 4 "phát ngôn sai" kinh điển về HMR — mỗi bẫy kèm cách nói đúng ngay sau mũi tên.

1. **"HMR (Hot Module Replacement) = giữ state"** (suông) → **không chính xác**: giữ state **ở component boundary** (React Fast Refresh), không giữ state **global** (ví dụ Context ở "trên" boundary bị sửa có thể reset). Nên nói: "keep **component** state, re-run phần không được bảo vệ".
2. **Nhầm HMR (Hot Module Replacement) với "HMR (Hot Module Replacement) = không bao giờ reload"** → sai: HMR (Hot Module Replacement) có **escalation rule** (không an toàn → full reload; dev server thay đổi config → server restart).
3. **"HMR (Hot Module Replacement) là của Vite"** → Vite *cung cấp* HMR (Hot Module Replacement) (module graph + WebSocket), nhưng **React-specific** HMR (Hot Module Replacement) = **React Refresh** (runtime). Webpack cũng HMR (Hot Module Replacement) (đơn vị là "module chunk"), Next.js cũng HMR (Hot Module Replacement) (unit-level + router-aware).
4. **Đánh giá HMR (Hot Module Replacement) theo "tốc độ dev server"** (Vite cold start nhanh) → HMR (Hot Module Replacement) = **nhiều lần** thay đổi nhỏ **mỗi lần**; "cold start" (lần đầu) là **chuyện khác** (Vite win bằng không cần pre-bundle).

## Gợi ý câu chốt

> "HMR (Hot Module Replacement) là 'thay module, không thay app': sửa file → dev server gửi diff → React Fast Refresh giữ state **tại boundary component**, chỉ re-render phần đổi. Full reload thì `createRoot` chạy lại từ đầu, state mất. HMR (Hot Module Replacement) không phải 'miễn phí' — nó có rule: nếu thay đổi không an toàn (thiếu cleanup, đổi hook, sửa config) thì **escalate full reload** (hoặc server restart). Hiểu rõ boundary này là cách debug 'HMR (Hot Module Replacement) không hoạt động' nhanh nhất."

> **Tóm gọn 1 câu:** HMR là "thay trang lỗi trong sách đang mở" — giữ state tại component boundary, nhưng đổi không an toàn thì tự in lại cả cuốn (full reload).

## Reference

- Vite HMR (Hot Module Replacement) — [vite.dev/guide/features#hot-module-replacement](https://vite.dev/guide/features/)
- Vite 8 release (rolldown + Oxc) — [vite.dev/blog/announcing-vite8](https://vite.dev/blog/announcing-vite8)
- React Refresh (vite-plugin-react) — [vitejs.dev/react.html](https://vitejs.dev/react.html)
- Next.js HMR (Hot Module Replacement) behavior — [nextjs.org/docs/app/building-your-application/next-internals](https://nextjs.org/docs/app/building-your-application/next-internals)
- Q3 (StrictMode) — double-invoke ở dev, tương quan "dev-only" tooling
- [`2_react-techniques/6_dev-tools/1-vite`](../../2_react-techniques/6_dev-tools/1-vite) — Vite dev server + HMR (Hot Module Replacement) trong tutorial

## Câu hỏi liên quan

- **Hỏi tiếp (liên tục)**: [Q3 — StrictMode?](../03-strictmode/README.md) · [Q2 — React 18 vs 19?](../02-react-18-vs-19/README.md)
- **Đào sâu (xuyên nhóm)**: [Q23 — build ra bundle quá to thì giảm bằng gì?](../23-bundle-size/README.md)
