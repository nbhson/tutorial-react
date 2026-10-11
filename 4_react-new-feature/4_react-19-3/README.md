# React 19.3 New Features

## Mô tả
- README tổng cho version **React 19.3** (ra mắt **09/2026**).
- Feature chính gồm 2 API từng ở dạng experimental (công bố [React Labs 04/2025][labs]) nay **stable**: **`<ViewTransition>`** và **Fragment Refs**; cùng **`browser()`** (API `react-dom` mới), **Trusted Types** support, và **`<Context>` render trực tiếp trong Server Component**.
- Đóng vai trò **điều hướng**: liệt kê từng bài con + tóm tắt 1-2 dòng mỗi feature.

[labs]: https://react.dev/blog/2025/04/23/react-labs-view-transitions-activity-and-more

## Bối cảnh version
- 19.0 (12/2024) chuẩn hóa Actions/form/RSC; 19.2 (10/2025) thêm `<Activity>`, `useEffectEvent`, `cacheSignal`, Partial Prerendering.
- 19.3 tiếp tục ở tầng **UI/animation và tích hợp trình duyệt**: animation chuyển cảnh khai báo, thao tác DOM theo nhóm không cần wrapper, và opt-out server rendering chính thức.
- Về API công khai, 19.3 **không phá vỡ** — chỉ thêm; nâng từ 19.0/19.1/19.2 mượt.

## Mục tiêu
- Dùng `<ViewTransition>` (kèm `addTransitionType`) để animate enter/exit/update/share, tích hợp Suspense.
- Dùng Fragment Ref (`<Fragment ref>`) để thao tác nhóm DOM con mà không thêm wrapper.
- Dùng `use(browser())` để đánh dấu component browser-only khi có SSR.

## Vấn đề giải quyết
- Chuyển gallery/tab/route cần hiệu ứng morph như app native → FLIP thủ công rất cực → `<ViewTransition>`.
- Đo/focus/observe nhiều sibling mà không có parent DOM, hoặc con không forward ref → Fragment Ref.
- Component phụ thuộc `localStorage`/timezone/`matchMedia` không render được trên server → `use(browser())`.

## Khái niệm cốt lõi
- **`<ViewTransition>`**: bọc subtree; React tự gọi `document.startViewTransition`; chỉ update trong **Transition** (`startTransition`, `useDeferredValue`, Suspense reveal) mới animate. 4 loại: **enter / exit / update / share**.
- **Fragment Ref**: `<Fragment ref={ref}>` (KHÔNG dùng `<>...</>`) trả về `FragmentInstance` với `addEventListener`, `focus`/`focusLast`/`blur`, `observeUsing`/`unobserveUsing`, `getClientRects`, `scrollIntoView`…
- **`use(browser())`**: API từ **`react-dom`**; trên server **suspend** (dùng fallback `<Suspense>`), trên client trả `undefined`. Bắt buộc có `<Suspense>` khi SSR.
- **Trusted Types**: React truyền `TrustedHTML`/`TrustedScript` qua DOM API không ép về string → hợp lệ với CSP `require-trusted-types-for 'script'`.
- **`<Context>` trong Server Component**: Server Component import Context từ `'use client'` và render `<Ctx value={...}>` trực tiếp, không cần Provider wrapper.

## Điều hướng bài học

| # | Bài | Feature (1-2 dòng) |
|---|-----|--------------------|
| 1 | [View Transitions](1_view-transitions/README.md) | `<ViewTransition>` + `addTransitionType`: animate enter/exit/update/share declarative, tích hợp Suspense; React tự gọi `startViewTransition`. |
| 2 | [Fragment Refs](2_fragment-refs/README.md) | `<Fragment ref>` trả `FragmentInstance`: thao tác nhóm DOM con (event/focus/observe/đo/scroll) mà không thêm `<div>` bọc. |
| 3 | [browser() API](3_browser-api/README.md) | `use(browser())` (từ `react-dom`) đánh dấu component **browser-only**: SSR hiển thị fallback, client render đọc API browser. |

## Cú pháp / API (tóm tắt)

```tsx
// 1. View Transition (bọc trong Transition mới animate)
<ViewTransition enter="fade-in" exit="fade-out"><Page /></ViewTransition>;
startTransition(() => { addTransitionType('next'); setSlide((s) => s + 1); });

// 2. Fragment Ref (không dùng <>...</>)
const ref = useRef(null);
<Fragment ref={ref}>{items.map((i) => <Card key={i.id} />)}</Fragment>;
ref.current?.focus();

// 3. browser() — opt-out SSR, PHẢI trong <Suspense> và Client Component
'use client';
use(browser('Cần API của browser.'));
```

## Luồng hoạt động (Flow)
1. `startTransition` → React commit DOM và gọi `startViewTransition`: chụp snapshot, morph ảnh cũ → mới, gọi event props nếu có.
2. `<Fragment ref>` → React tạo `FragmentInstance` trên các DOM con cấp 1; gán `ref.current` khi commit.
3. `use(browser())` trên server → suspend (để lại fallback); trên client → trả `undefined` và render tiếp.
4. Trusted Types: React truyền nguyên object tin cậy cho `innerHTML`/script sink thay vì ép string.
5. Server Component render `<Context value>` trực tiếp → chia sẻ data cho client tree không cần Provider.

## So sánh với cách làm cũ

| Khía cạnh | Trước 19.3 | React 19.3 | Lợi ích |
|---|---|---|---|
| Animation chuyển cảnh | FLIP tay / gọi `startViewTransition` thủ công | `<ViewTransition>` | Đồng bộ Suspense, ít code |
| Thao tác nhóm DOM con | Thêm wrapper `<div>` hoặc ref từng con | `<Fragment ref>` | DOM phẳng, dùng được component không forward ref |
| Component chỉ chạy ở browser | `typeof window` / `useState`+`useEffect` 2-pass | `use(browser())` | Không nháy, tích hợp Suspense |
| CSP Trusted Types | React ép string → bị CSP chặn | Trusted Types pass-through | Dùng được CSP nghiêm |
| Provider cho Server Component | Cần wrapper `'use client'` | `<Context>` render trực tiếp | Bớt component trung gian |

## Breaking changes / Deprecations trong React 19.3
- **Không có breaking change lớn** — 19.3 là bản minor tương thích ngược với 19.0–19.2.
- Nếu trước đây bạn dùng `<ViewTransition>`/Fragment Ref ở bản **canary/experimental**, cập nhật import và kiểm tra ký API theo bản stable 19.3.
- `<ViewTransition>` hiện **chỉ hỗ trợ DOM** (chưa có React Native).
- Không có API nào bị gỡ ở 19.3.

## Nâng cấp từ React 19.2 cần lưu ý gì
1. **Nâng `react`/`react-dom` cùng version 19.3** để có type và API mới.
2. **View Transitions**: bọc update trong `startTransition` (update urgent **không** animate); đảm bảo `<ViewTransition>` là node đầu tiên của subtree; tôn trọng `prefers-reduced-motion`.
3. **Fragment Refs**: đổi `<>...</>` → `<Fragment ref>` khi cần ref; nhớ `scrollIntoView` chỉ nhận boolean.
4. **`browser()`**: đảm bảo component là Client Component (`'use client'`) và **có `<Suspense>`** bao quanh khi SSR, nếu không server render fail.
5. **Trusted Types**: nếu site đã enforce `require-trusted-types-for 'script'`, kiểm tra lại luồng render nhạy cảm.
6. **Server Component + Context**: gỡ các Provider wrapper chỉ để truyền prop — render `<Context value>` trực tiếp.

## Lỗi thường gặp
1. **Đổi state ngoài Transition** → không thấy animation → fix: bọc `startTransition`/`useDeferredValue`.
2. **Đặt DOM node trước `<ViewTransition>`** → enter/exit không chạy → fix: đưa `<ViewTransition>` lên đầu subtree.
3. **Truyền ref vào `<>...</>`** → vô tác dụng → fix: dùng `<Fragment ref={ref}>`.
4. **Thiếu `<Suspense>` với `use(browser())`** → server render fail → fix: bọc `<Suspense fallback={...}>`.
5. **Tưởng `browser()` trả env info** → sai; nó là opaque value → fix: đọc API browser sau `use(browser())`.

## Khi nào dùng / Khi nào không
- **Dùng**: gallery/tab/carousel/route transition; đo/focus/observe nhóm element không có wrapper; component đọc `localStorage`/timezone khi có SSR.
- **Không**: update urgent cần tức thì; animation chỉ trang trí; React Native (ViewTransition chưa hỗ trợ); đã có thư viện animation chuyên sâu (Motion) đáp ứng tốt.

## Bài tập nhỏ
- Dựng carousel 3 slide: hai nút ⬅️/➡️ gọi `startTransition(() => { addTransitionType('previous'|'next'); setSlide(...) })`, bọc slide trong `<ViewTransition enter={{next:'from-right',previous:'from-left'}} exit=... default="none">` + CSS tương ứng. Kiểm tra slide trượt đúng hướng và **không** animate khi state đổi ngoài Transition.

## Reference
- [React 19.3 Release](https://react.dev/blog/2026/09/09/react-19-3)
- [<ViewTransition>](https://react.dev/reference/react/ViewTransition)
- [addTransitionType](https://react.dev/reference/react/addTransitionType)
- [<Fragment>](https://react.dev/reference/react/Fragment)
- [browser](https://react.dev/reference/react-dom/browser)

## Yêu cầu & chạy thử
- React 19.3+, Node.js 18+, browser Chromium mới nhất để thấy đủ View Transition.
- `npm i react@19.3 react-dom@19.3 && npm run dev`
- Xem lại: [React 19.2](../3_react-19-2/README.md) (`<Activity>`, `useEffectEvent`, `cacheSignal`).
