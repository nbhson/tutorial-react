# React DevTools + Performance Tracks

> Nguồn: https://react.dev/learn/react-developer-tools — https://developer.chrome.com/docs/devtools/performance

## Mục tiêu
- Dùng React DevTools (Components + Profiler) để tìm re-render thừa và nguyên nhân render.
- Dùng Chrome Performance/UX tracks đo long task, layout thrash, thời gian commit thực tế.
- Có quy trình "nghi ngờ → Profiler xác nhận → sửa → đo lại" thay vì tối ưu bừa.

## Tổng quan
- 2 công cụ bổ trợ: **React DevTools** nhìn vào thế giới React (component render, props, profiler), **Chrome DevTools Performance** nhìn vào thế giới trình duyệt (paint, layout, JS execution).
- React 19.2+ có **Performance Tracks** trong React DevTools: xem render của từng `Suspense` boundary, thời gian `useEffect`, `useMemo`, `useDeferredValue` ngay trên timeline.
- Áp dụng khi: UI lag khi gõ, scroll chậm, re-render lặp, hoặc cần bằng chứng trước/sau tối ưu.

## Khái niệm cốt lõi
- **Re-render thừa**: component render lại dù props/state không đổi. Profiler gắn cờ màu vàng/đỏ cho component render lâu, và hiện **reason** (props changed, state changed, hooks changed, parent changed).
- **Flamegraph vs Ranked**: flamegraph kẹp theo thứ tự render lồng nhau; ranked sắp theo thời gian — bắt đầu từ ranked để tìm "nghi phạm" nhanh.
- **Commit**: lần render được React "commit" vào DOM (sau khi diff). Mỗi commit một dòng trên timeline.
- **Highlight updates**: bật để thấy component nào nhấp nháy khi tương tác.
- **Long task (> 50ms)**: chặn main thread — gây jank; tìm ở Chrome Performance → Main track.
- **Layout thrash**: đọc+ghi layout liên tục gây reflow lặp; thấy dạng "layout/recalc" dày đặc.
- **User Timing API** (`performance.mark/measure`): đánh dấu vùng đo trong code, hiện trên Chrome Performance.

## Luồng hoạt động / Cách áp dụng
1. Cài React DevTools (extension) — với React 19.2+ mở **Performance** tab.
2. Components tab: bật **Highlight updates**, thao tác → thấy component nào render lại.
3. Profiler: **Record**, thao tác 1 lần, dừng → xem commits, sắp theo `Ranked`.
4. Xác định "vì sao render" (reason) của component nghi vấn.
5. Sửa: `memo`, nâng state lên/xuống, `useDeferredValue`, tách component (xem nhóm 3 + bài 8/4).
6. Chrome Performance: record khi scroll/gõ → tìm long task > 50ms và layout thrash.
7. Đánh dấu vùng quan trọng bằng User Timing, đo lại so sánh trước/sau.

## Ví dụ chi tiết
```tsx
import { memo } from 'react';

// Đặt tên rõ ràng để flamegraph dễ đọc (thay vì "Anonymous")
export const UserRow = memo(function UserRow({ name }: { name: string }) {
  return <li>{name}</li>;
});
```

```tsx
// Đo render bằng User Timing API — hiện trên Chrome Performance
import { addProfile } from 'react-render-tracking';
import { memo, useProfiler } from 'react';

export function MeasuredList({ names }: { names: string[] }) {
  const onRender = () => {
    performance.mark('list-end');
    performance.measure('list-render', 'list-start', 'list-end');
  };
  performance.mark('list-start');
  queueMicrotask(onRender); // đo xong sau khi render lần này đã commit

  return (
    <ul>
      {names.map((n) => (
        <UserRow key={n} name={n} />
      ))}
    </ul>
  );
}
```

```tsx
// React 19.2+: export component ra để DevTools Performance track render theo boundary
export function ProfileCard() {
  return (
    // Suspense boundary xuất hiện như một track riêng trên timeline
    <Suspense fallback={<p>Đang tải…</p>}>
      <Profile />
    </Suspense>
  );
}
```

```ts
// Nếu cần theo dõi ngoài DevTools: console.timeStamp đánh dấu trong timeline
performance.timeStamp('list-rendered');
// UI ngoài production: chỉ chạy khi import.meta.env.DEV
if (import.meta.env.DEV) console.profile('filter-interaction');
```

## Giải thích từng phần
- `memo(function UserRow(...))`: giữ tên component → DevTools hiện "UserRow", không phải "Anonymous".
- `performance.mark/measure`: tạo marker/range trong Chrome Performance, dễ chia lịch sử trước sau khi tối ưu.
- `queueMicrotask(onRender)`: defer đo đến sau khi commit hiện tại.
- `Suspense`: với React 19.2+ trở thành boundary track — thấy thời gian resolve từng phần UI.
- `console.profile`: ghi profile tạm thời khi dev, nhớ xóa ở production.

### Đọc số liệu Profiler
```text
Commit time: thời gian React tính + commit 1 lần render
  > 16ms  → có thể rớt frame (60fps)
  > 50ms  → long task, cảm nhận rõ giật

Reason quan trọng nhất:
  "Parent re-rendered"  → xem có nên memo/tách component
  "Hook changed"        → kiểm tra giá trị hook phụ thuộc
  "Props changed"       → so sánh reference props (object/function mới mỗi render)
```

## Lỗi thường gặp / Chống chỉ định
- **Tối ưu không đo trước**: memo bừa, `useCallback` vô nghĩa → luôn Profiler xác nhận rồi mới sửa.
- **Mở "Highlight updates" ở production build**: không hoạt động/không phản ánh đúng → dùng build dev.
- **Chỉ nhìn flamegraph mà bỏ ranked**: mất thời gian với component không quan trọng → xem ranked/commit trước.
- **Bỏ qua Chrome Performance khi lag do long task không liên quan React** (layout, thư viện vẽ) → phân biệt được nguồn jank.
- **Giữ `console.profile`/User Timing ở production**: chi phí nhỏ nhưng nhiễu → bọc bằng `if (import.meta.env.DEV)`.

## Best practices / Mẹo
- Quy trình lặp: record → xác định reason → 1 thay đổi → đo lại; không "fix nước rút 5 thứ cùng lúc".
- Dùng "Why did you render" hook (dev-only) để log reason cụ thể khi cần.
- Với list dài, `useDeferredValue` + `memo` item + key ổn định là combo phổ biến.
- Lưu profile JSON để so sánh giữa các phiên bản code.
- Kết hợp React DevTools + Performance tracks của Chrome cho bức tranh đầy đủ render → paint.

## Bài tập nhỏ
Tạo list 500 item (thêm `useState` filter), mở Highlight updates gõ filter: ghi lại danh sách component render lại mỗi lần gõ. Sửa bằng `useDeferredValue` + `memo`, record Profiler trước/sau và so sánh thời gian commit.

## Reference
- [React Developer Tools](https://react.dev/learn/react-developer-tools)
- [React DevTools — Profiler](https://react.dev/learn/adding-interactivity#profiling-react-components)
- [Chrome DevTools — Performance](https://developer.chrome.com/docs/devtools/performance)
- [User Timing API](https://developer.mozilla.org/en-US/docs/Web/API/Performance_API/User_timing)