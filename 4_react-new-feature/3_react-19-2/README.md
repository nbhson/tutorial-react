# React 19.2 New Features

## Mô tả
- README tổng cho version **React 19.2** (ra mắt **10/2025**) — bản "nâng cấp lớn" với các primitive mới giúp ẩn/hiện UI rẻ hơn, tách event khỏi Effect, và rendering server hiệu quả hơn.
- Feature chính: **`<Activity>`** (stable), **`useEffectEvent`** (stable), **`cacheSignal`** (RSC, stable), **Partial Pre-rendering** (API core còn `unstable_`, dùng qua framework).
- Đóng vai trò **điều hướng**: liệt kê từng bài con + tóm tắt 1-2 dòng mỗi feature.

## Bối cảnh version
- React 19.0 (12/2024) chuẩn hóa Actions/form; React 19.2 là bản **minor nhưng nhiều primitive mới**, tiếp tục lấp các "nhu cầu thực tế" mà trước đây phải tự xử.
- Ba bài toán được nhắm: (1) ẩn tab/panel bằng unmount làm mất state/scroll/input, (2) callback trong Effect đọc props/state mới gây reconnect/refetch thừa, (3) server fetch chạy tới cùng dù render bị bỏ, và (4) full static chậm / full dynamic chậm.
- `<Activity>` và `useEffectEvent` là thay đổi ở tầng lập trình component; `cacheSignal` và PPR nằm ở tầng server/RSC.
- 19.2 là bước đệm quan trọng trước 19.3 (View Transitions, Fragment refs) và là mảnh ghép cho kiến trúc RSC.
- Về API công khai, 19.2 **không phá vỡ** — chỉ thêm; nâng từ 19.0/19.1 mượt.

## Mục tiêu
- Dùng `<Activity>` để giữ state/DOM khi ẩn, pre-render tab sắp mở, cải thiện hydration.
- Dùng `useEffectEvent` để Effect chỉ re-run theo deps đúng, callback luôn đọc giá trị mới nhất.
- Hiểu `cacheSignal` (RSC) hủy fetch theo cache lifecycle và PPR kết hợp static shell + dynamic holes.

## Vấn đề giải quyết
- Ẩn tab bằng unmount làm mất state/draft → `<Activity>` giữ state mà vẫn dọn Effects.
- Callback trong Effect đọc props/state mới → reconnect/refetch thừa → `useEffectEvent` gỡ khỏi deps.
- Server fetch chạy tới cùng dù render bị bỏ → `cacheSignal` abort theo lifecycle.
- Full static cũ / full dynamic chậm → PPR: shell tĩnh nhanh + hole động tươi.

## Khái niệm cốt lõi
- **`<Activity>`**: `mode="visible"|"hidden"`; hidden dùng `display:none`, **destroy Effects**, **giữ state + DOM**, con vẫn re-render priority thấp; pre-render + selective hydration.
- **`useEffectEvent`**: hàm identity ổn định, luôn đọc giá trị mới nhất, **không** là dependency; chỉ gọi trong Effect/event.
- **`cacheSignal`**: `AbortSignal` gắn cache entry; **chỉ RSC**; dùng `cache()` + `fetch({ signal })`.
- **PPR**: `prerender` (react-dom/static) trả `prelude` + `postponed`; `resume` (react-dom/server) render hole và stream.

## Điều hướng bài học

| # | Bài | Feature (1-2 dòng) |
|---|-----|--------------------|
| 1 | [Activity](1_activity/README.md) | Ẩn/hiện subtree bằng `display:none` nhưng **không unmount**: giữ state/DOM, dọn Effects, pre-render + selective hydration. Rẻ hơn hẳn mount/unmount cho tab/wizard. |
| 2 | [useEffectEvent](2_useEffectEvent/README.md) | Tách logic non-reactive khỏi Effect: callback luôn đọc giá trị mới, không gây re-run, bỏ `eslint-disable`. Chỉ gọi trong Effect/event. |
| 3 | [cacheSignal](3_cacheSignal/README.md) | `AbortSignal` gắn lifecycle `cache()` (chỉ RSC): tự hủy fetch khi render xong/bỏ/lỗi. Ít plumbing hơn `AbortController` thủ công. |
| 4 | [Partial Pre-rendering](4_partial-prerender/README.md) | `prerender` + `resume`: shell tĩnh cache CDN + hole động stream, TTFB tốt hơn full SSR. API core còn `unstable_`, dùng qua framework. |

## Cú pháp / API (tóm tắt)

```tsx
<Activity mode={show ? 'visible' : 'hidden'}><Panel /></Activity>

const onEvent = useEffectEvent((x) => { /* đọc props/state mới nhất */ });

const getData = cache(async (id) => fetch(url, { signal: cacheSignal() }));

const { prelude, postponed } = await prerender(<App />); // react-dom/static
const stream = await resume(<App />, postponed);          // react-dom/server
```

## Luồng hoạt động (Flow)

1. Tab/panel ẩn: Activity giữ state, dọn Effect, con vẫn render sẵn (priority thấp).
2. Effect subscribe: đọc callback qua `useEffectEvent` → không reconnect khi giá trị không phải dep.
3. Server fetch: `cache()` dedupe + `cacheSignal()` abort khi render bỏ.
4. PPR: shell static trả ngay; hole `<Suspense>` resume và stream sau.

## So sánh với cách làm cũ

| Khía cạnh | Trước 19.2 | React 19.2 | Lợi ích |
|---|---|---|---|
| Ẩn panel | Unmount (mất state) hoặc luôn mount (tốn effect) | `<Activity>` giữ state + dọn Effect | UX giữ draft, ít tài nguyên |
| Callback trong Effect | Thêm vào deps / ref mirror / eslint-disable | `useEffectEvent` | Không re-run thừa, lint sạch |
| Hủy fetch server | `AbortController` thủ công | `cacheSignal()` | Ít plumbing, không leak |
| Rendering page nửa tĩnh | Chọn SSG hoặc dynamic | PPR | Nhanh + tươi |

## Breaking changes / Deprecations trong React 19.2
- **Không có breaking change lớn** — 19.2 là bản minor tương thích ngược với 19.0/19.1.
- **`useEffectEvent` ổn định**: nếu trước đây bạn dùng bản experimental `useEvent`/`useEffectEvent` (canary), cập nhật import/đường dẫn cho đúng bản stable.
- **`<Activity>` thay pattern "ẩn bằng CSS" tự chế**: code cũ vẫn chạy, nhưng nên chuyển dần sang `<Activity>` để được dọn Effect + selective hydration đúng chuẩn.
- **PPR API còn `unstable_`**: không dùng trực tiếp trong app production nếu không qua framework (Next.js canary) — sẽ đổi tên/ký khi ổn định.
- **`cacheSignal` chỉ có trong RSC**: trên client sẽ ném lỗi — đừng gọi ngoài server cache scope.
- Không có API nào bị gỡ ở 19.2.

## Nâng cấp từ React 19.0/19.1 cần lưu ý gì
1. **Đổi pattern ẩn UI** sang `<Activity>` nếu cần giữ state: thay `{show && <Panel/>}` (unmount) hoặc `display:none` thủ công bằng `<Activity mode>`.
2. **Đảm bảo Effect cleanup đúng** khi chuyển sang `<Activity>`: side-effect DOM (video/audio) cần `useLayoutEffect` cleanup vì Effects bị destroy khi hidden.
3. **Thay "ref mirror" trong Effect bằng `useEffectEvent`**: gỡ `useRef` giữ giá trị mới nhất + `eslint-disable`, dùng `useEffectEvent` cho logic non-reactive.
4. **Chỉ gọi `useEffectEvent` trong Effect/event** — gọi trong render sẽ cảnh báo.
5. **RSC**: bọc fetch helper bằng `cache()` và truyền `signal: cacheSignal()` để tự abort; không dùng `cacheSignal` trên client.
6. **PPR**: chỉ thử qua framework (Next.js canary); đưa `await`/dynamic API vào hole `<Suspense>`, giữ shell tĩnh.
7. **Nâng `react`/`react-dom` cùng version 19.2** để có type và API mới (`@types/react` tương ứng).
8. Không cần đổi gì khác — 19.0 code chạy nguyên trên 19.2.

## Lỗi thường gặp
1. **Effect không cleanup với `<Activity>`** → side-effect DOM vẫn chạy (video/audio) → fix: `useLayoutEffect` cleanup.
2. **Gọi `useEffectEvent` trong render** → React cảnh báo → fix: chỉ trong Effect/event.
3. **Dùng `cacheSignal` ngoài RSC/cache()** → ném lỗi → fix: chỉ trong cache scope server.
4. **`await`/dynamic API trong shell PPR** → shell mất tĩnh → fix: đưa vào hole `<Suspense>`.
5. **Fan-out nested Activity cho list lớn** → tốn DOM/memory → fix: unmount/virtualize.

## Khi nào dùng / Khi nào không
- **Dùng**: tab/wizard giữ state, Effect có callback đọc props mới, RSC fetch cần abort, page nửa tĩnh nửa động.
- **Không**: subtree ẩn quá nặng; logic thực sự reactive (không dùng `useEffectEvent` chữa cháy); client fetch thuần (dùng `AbortController`).

## Bài tập nhỏ
- Dựng app tab 2 panel dùng `<Activity>` (giữ draft), một Effect subscribe dùng `useEffectEvent` đọc theme mới nhất, và log "connect/disconnect" để kiểm chứng không reconnect khi đổi theme.

## Reference
- [React 19.2 Release](https://react.dev/blog/2025/10/01/react-19-2)
- [<Activity>](https://react.dev/reference/react/Activity)
- [useEffectEvent](https://react.dev/reference/react/useEffectEvent)
- [cacheSignal](https://react.dev/reference/react/cacheSignal)
- [prerender](https://react.dev/reference/react-dom/static/prerender)

## Yêu cầu & chạy thử
- React 19.2+, Node.js 18+; PPR cần framework (Next.js canary).
- `npm i react@19.2 react-dom@19.2 && npm run dev`
- Xem tiếp: [React 19.3](../4_react-19-3/README.md) (View Transitions, Fragment refs, `browser()`) và [React 19.0](../2_react-19/README.md) (nền Actions/`use()`).
