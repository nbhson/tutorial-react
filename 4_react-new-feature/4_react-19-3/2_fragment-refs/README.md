# 2. Fragment Refs

## Mô tả
- Từ React 19.3, **`<Fragment>` nhận prop `ref`**. Ref nhận về một **`FragmentInstance`** — object cung cấp một tập method DOM thường dùng, thao tác trên **các DOM con cấp 1** của Fragment.
- Nó giải quyết bài toán: nhóm nhiều sibling mà **không có parent DOM chung**, hoặc component con **không forward `ref`** (ví dụ component từ thư viện bạn không sửa được).
- Lưu ý quan trọng: **không dùng shorthand `<>...</>`** khi cần ref — phải import `Fragment` và viết `<Fragment ref={...}>`.

## Mục tiêu
- Gắn ref vào `<Fragment>` và dùng `FragmentInstance` để gắn event, focus, observe, đo đạc, cuộn.
- Hiểu "first-level host children": method nào nhắm **con DOM cấp 1**, method nào **đệ quy sâu**.
- Dùng thuộc tính `reactFragments` để chia sẻ một `IntersectionObserver` cho nhiều Fragment.

## Vấn đề giải quyết
- Muốn đo tổng chiều cao 3 `<li>` hoặc focus item đầu mà **không muốn thêm `<div>` bọc ngoài** (sẽ phá flex/grid/table semantics).
- Muốn gắn behavior (event, observer) lên một nhóm element, kể cả khi component con không expose `ref`. Cách cũ: ref từng child rồi gom tay (không được nếu con không nhận ref), hoặc thêm wrapper div thừa.

## Khái niệm cốt lõi
- **`FragmentInstance`** hoạt động trên DOM con **theo nhóm**, không đổi cấu trúc DOM. Các method:
  - **Event**: `addEventListener(type, listener, options?)`, `removeEventListener(...)`, `dispatchEvent(event)`.
  - **Focus**: `focus(options?)`, `focusLast(options?)`, `blur()`.
  - **Observe**: `observeUsing(observer)`, `unobserveUsing(observer)` — nhận `IntersectionObserver` hoặc `ResizeObserver`.
  - **Đo đạc / cuộn**: `getClientRects()`, `getRootNode(options?)`, `compareDocumentPosition(otherNode)`, `scrollIntoView(alignToTop?)`.
- **Cấp tác động**: `addEventListener`, `removeEventListener`, `observeUsing`, `unobserveUsing`, `getClientRects` chỉ nhắm **first-level host (DOM) children**. Còn `focus` và `focusLast` **đệ quy sâu (depth-first)** tìm element focusable đầu/cuối.
- **`scrollIntoView` nhận boolean** (`alignToTop`), **không** nhận options object như `Element.scrollIntoView`. Truyền options → **throw lỗi**. `true` (mặc định) cuộn con đầu lên đỉnh; `false` cuộn con cuối xuống đáy.
- **`reactFragments`**: mỗi DOM con cấp 1 của một Fragment có ref được gắn thêm thuộc tính `reactFragments` — một `Set<FragmentInstance>` chứa mọi instance sở hữu element đó (dùng để route entry của observer dùng chung).

## Cú pháp / API

```tsx
import { Fragment, useRef, useEffect } from 'react';

function Group({ children, onClick }: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  const fragmentRef = useRef<React.ComponentRef<typeof Fragment>>(null);

  useEffect(() => {
    const instance = fragmentRef.current;
    if (!instance) return;
    instance.addEventListener('click', onClick);
    return () => instance.removeEventListener('click', onClick);
  }, [onClick]);

  // PHẢI dùng <Fragment> (không dùng <>...</>) khi truyền ref
  return <Fragment ref={fragmentRef}>{children}</Fragment>;
}
```

Bảng method nhanh:

| Method | Tác động lên | Ghi chú |
|---|---|---|
| `addEventListener` / `removeEventListener` | Con DOM cấp 1 | Tự thêm/gỡ khi con đổi |
| `dispatchEvent` | Fragment | Có thể bubble lên parent |
| `focus` / `focusLast` / `blur` | Toàn bộ con (depth-first) | Tìm element focusable |
| `observeUsing` / `unobserveUsing` | Con DOM cấp 1 | `IntersectionObserver`/`ResizeObserver` |
| `getClientRects` | Con DOM cấp 1 | Trả `Array<DOMRect>` |
| `getRootNode` | Parent của Fragment | `Document`/`ShadowRoot` |
| `compareDocumentPosition` | Fragment vs node khác | Trả bitmask |
| `scrollIntoView` | Con cấp 1 | Nhận boolean, **không** nhận options |

## Luồng hoạt động (Flow)
1. React render `<Fragment ref={ref}>`, tìm các DOM con cấp 1 (xuyên qua component wrapper) và tạo `FragmentInstance`.
2. React gán `ref.current = instance` (khi mount/commit) và `null` khi Fragment unmount.
3. Bạn gọi method trên `instance` — thường trong `useEffect`/`useLayoutEffect` hoặc event handler.
4. Khi con được thêm/gỡ động, `FragmentInstance` tự cập nhật listener/observer tương ứng.

## Ví dụ chi tiết

```tsx
// example.tsx — đo + cuộn tới card đầu, focus con đầu tiên, không có div bọc
import { Fragment, useRef } from 'react';

export default function FragmentRefDemo() {
  // ref trỏ tới một FragmentInstance (không phải mảng DOM node!)
  const ref = useRef<React.ComponentRef<typeof Fragment>>(null);

  function measureAndScroll() {
    const instance = ref.current;
    if (!instance) return;
    const rects = instance.getClientRects();          // DOMRect[] của con cấp 1
    if (rects.length === 0) return alert('Fragment không có DOM con!');
    const totalH = rects.reduce((sum, r) => sum + r.height, 0);
    instance.scrollIntoView();                        // boolean, KHÔNG truyền options
    alert(`Fragment có ${rects.length} nodes, tổng cao ≈ ${Math.round(totalH)}px`);
  }

  function focusFirst() {
    ref.current?.focus();   // tìm element focusable đầu tiên theo depth-first
  }

  return (
    <div>
      <h2>Fragment refs (React 19.3)</h2>
      {/* Không có div bọc — DOM phẳng, ref gom 3 article */}
      <Fragment ref={ref}>
        <article style={{ border: '1px solid #ccc', padding: 8 }}>
          Card 1 <button>Chọn</button>
        </article>
        <article style={{ border: '1px solid #ccc', padding: 8 }}>Card 2</article>
        <article style={{ border: '1px solid #ccc', padding: 8 }}>Card 3</article>
      </Fragment>
      <button onClick={measureAndScroll} style={{ marginTop: 8 }}>
        Đo + cuộn tới card đầu
      </button>
      <button onClick={focusFirst} style={{ marginTop: 8, marginLeft: 8 }}>
        Focus con đầu tiên
      </button>
    </div>
  );
}
```

## Giải thích từng phần
- `useRef<React.ComponentRef<typeof Fragment>>(null)` — kiểu chính xác là `FragmentInstance | null`. Ở đây dùng helper type của React để không phải import type nội bộ.
- `instance.getClientRects()` trả **mảng `DOMRect`** cho từng con cấp 1 (article), nhờ đó tính tổng chiều cao mà không cần wrapper.
- `instance.scrollIntoView()` — chỉ truyền `true`/`false`; muốn cuộn mượt thì làm bằng CSS `scroll-behavior: smooth` trên ancestor, **không** truyền `{ behavior: 'smooth' }` (sẽ throw).
- `instance.focus()` tìm xuyên qua `article` để tới `<button>`, dù button nằm sâu bên trong — đây là điểm khác biệt với `addEventListener` (chỉ nhắm con cấp 1).
- `<Fragment ref={ref}>` — **bắt buộc** viết đầy đủ; `<>...</>` không nhận ref.

## So sánh với cách làm cũ

| Cách cũ | Cách mới (Fragment ref) | Lợi ích |
|---|---|---|
| Thêm `<div>` bọc để gắn ref | `<Fragment ref>` không thêm DOM | Không phá layout/flex/grid/table |
| Ref từng child rồi gom bằng tay | Một `FragmentInstance` thao tác cả nhóm | Ít code, tự cập nhật khi con đổi |
| Buộc con phải forward `ref` | Hoạt động với con không expose ref | Dùng được cả component thư viện |
| Tự quản `IntersectionObserver` cho từng node | `observeUsing` + `reactFragments` | Chia sẻ observer, nhẹ hơn |

## Lỗi thường gặp
1. **Truyền ref vào `<>...</>`** → không có tác dụng/lỗi. Vì sao: shorthand không nhận prop. Fix: import `Fragment` và dùng `<Fragment ref={ref}>`.
2. **Coi `ref.current` là mảng/iterable rồi `[...ref.current]`** → sai kiểu. Vì sao: ref là `FragmentInstance`. Fix: gọi method (`getClientRects`, `focus`, ...).
3. **`scrollIntoView({ behavior: 'smooth' })`** → throw. Vì sao: `FragmentInstance.scrollIntoView` chỉ nhận boolean. Fix: dùng `scrollIntoView(true/false)` và set `scroll-behavior` bằng CSS.
4. **Mong `addEventListener` bắt sự kiện ở con cháu sâu** → không được. Vì sao: event method chỉ nhắm con **cấp 1**. Fix: gắn listener ở nơi có con cấp 1, hoặc dùng `focus` (đệ quy sâu) nếu mục đích là focus.
5. **`observeUsing` trên Fragment chỉ toàn text** → React cảnh báo. Vì sao: observer không hoạt động trên text node. Fix: bọc con trong element.

## Khi nào dùng / Khi nào không
- **Dùng**: đo layout/scroll nhiều node; focus nhóm input; gắn event/observer cho nhóm element mà không đổi DOM; dùng component con không forward ref; table/flex/grid cần DOM phẳng.
- **Không dùng**: khi đã có một element cha tự nhiên (dùng `ref` trên chính element đó đơn giản hơn); khi cần style/animate như một khối — cân nhắc `<ViewTransition>`; không phải để thay thế state logic.

## Bài tập nhỏ
- Viết `InView({ onChange, children })` dùng `<Fragment ref>` + `observeUsing(new IntersectionObserver(...))`. Khi có ít nhất một con cấp 1 nằm trong viewport thì gọi `onChange(true)`, ngược lại `onChange(false)`. Nhớ `unobserveUsing` trong cleanup. Kiểm tra bằng cách bọc vài `<Card>` và cuộn: màu nền đổi khi card vào/ra viewport, mà **không** cần thêm `<div>` bọc.

## Reference
- [React 19.3 Release — Fragment Refs](https://react.dev/blog/2026/09/09/react-19-3)
- [<Fragment> reference](https://react.dev/reference/react/Fragment)
- [ref callback](https://react.dev/reference/react-dom/components/common#ref-callback)
