# 1. View Transitions

## Mô tả
- `<ViewTransition>` là thành phần mới **stable từ React 19.3** (09/2026). Trước đó nó từng xuất hiện dưới dạng experimental ở React Labs (04/2025). Nó tích hợp **View Transition API** của trình duyệt theo kiểu khai báo.
- Bọc subtree trong `<ViewTransition>`; React **tự gọi `document.startViewTransition`** phía sau để chụp snapshot cũ/mới rồi để browser morph. Bạn **không gọi `startViewTransition` thủ công** nữa — nếu trang có code gọi tay, React sẽ ngắt nó và tự điều phối.
- Chỉ update nằm trong **Transition** mới animate: `startTransition`, `useDeferredValue`, hoặc màn reveal của `<Suspense>`. `setState` urgent thường cập nhật ngay và **không** kích hoạt animation.

## Mục tiêu
- Phân biệt 4 loại animation: **enter / exit / update / share** và hiểu khi nào React chọn loại nào.
- Dùng `name` cho **shared element transition** (thumbnail morph thành ảnh lớn) và hiểu vì sao `name` phải unique.
- Tùy biến animation bằng **View Transition Class** (`default/enter/exit/update/share`) kèm CSS, hoặc bằng **event props** (`onEnter/onExit/onShare/onUpdate`) + Web Animations API.
- Gắn **`addTransitionType`** để chọn animation theo *nguyên nhân* của transition (ví dụ `next` vs `previous`).

## Vấn đề giải quyết
- Chuyển gallery/tab/route muốn hiệu ứng morph (ảnh nhỏ → ảnh lớn) kiểu app native. Tự làm FLIP (First–Last–Invert–Play) rất cực: phải đo vị trí trước/sau, xử lý Suspense thay DOM bất đồng bộ, dễ nhấp nháy.
- View Transition API của browser giải quyết phần "chụp và morph", nhưng dùng trực tiếp rất khó đồng bộ với React (chụp lúc nào, commit lúc nào). `<ViewTransition>` để React điều phối và gắn chặt với pipeline Transition/Suspense.

## Khái niệm cốt lõi
- **Bọc subtree**: React gắn `view-transition-name` vào inline style của DOM node gần nhất bên trong `<ViewTransition>`. Nếu có nhiều con cùng cấp, React thêm hậu tố để mỗi cái unique nhưng vẫn coi là một nhóm.
- **Các loại animation (trigger)**:
  - **enter**: `<ViewTransition>` được thêm vào (và là thứ đầu tiên trong subtree đó).
  - **exit**: `<ViewTransition>` bị gỡ ra.
  - **update**: con bên trong đổi style/nội dung, hoặc chính boundary đổi kích thước/vị trí do sibling.
  - **share**: một `<ViewTransition name=...>` bị gỡ ở chỗ này và một cái **cùng `name`** được thêm ở chỗ khác trong **cùng một Transition**.
- **`name`**: dùng **chỉ cho shared element**. Các trường hợp khác React tự sinh name unique — đừng đặt `name` bừa để tránh animation ngoài ý muốn.
- **View Transition Class**: các prop `default`, `enter`, `exit`, `update`, `share` nhận `"auto"` | `"none"` | `"class-name"` | object `{ [transitionType]: value, default: value }`. Nếu `default="none"` thì mọi trigger tắt trừ cái được liệt kê rõ.
- **View Transition Event**: `onEnter/onExit/onShare/onUpdate` nhận `(instance, types)`. `instance` có `old`, `new`, `group`, `imagePair`, `name` (các pseudo-element). Mỗi event nên **trả về hàm cleanup**, được gọi khi transition kết thúc. `onShare` ưu tiên hơn `onEnter`/`onExit`.
- **`addTransitionType(type)`**: gọi bên trong `startTransition` để ghi lại "nguyên nhân". React cũng thêm type vào element dưới dạng view transition type để CSS dùng selector `:active-view-transition-type(...)`.

## Cú pháp / API

```tsx
import { ViewTransition, startTransition, addTransitionType } from 'react';

// 1. Cách dùng cơ bản — đặt TRƯỚC mọi DOM node trong subtree
<ViewTransition>
  <Component />
</ViewTransition>

// 2. Class riêng cho từng loại (tắt hết, chỉ bật enter/exit)
<ViewTransition default="none" enter="slide-in" exit="slide-out">
  <Page />
</ViewTransition>

// 3. Class theo Transition Type
<ViewTransition
  enter={{ next: 'from-right', previous: 'from-left' }}
  exit={{ next: 'to-left', previous: 'to-right' }}
>
  <Page />
</ViewTransition>

// 4. Điều khiển bằng JS + cleanup
<ViewTransition
  onEnter={(instance) => {
    const anim = instance.new.animate(
      [{ opacity: 0 }, { opacity: 1 }],
      { duration: 300 },
    );
    return () => anim.cancel();
  }}
>
  <div>...</div>
</ViewTransition>

// 5. Ghi nguyên nhân để chọn animation
startTransition(() => {
  addTransitionType('next');
  setSlide((s) => s + 1);
});
```

CSS tùy biến dùng pseudo-selector với class của View Transition Class:

```css
::view-transition-group(.slide-in) { animation-duration: 300ms; }
::view-transition-old(.slide-in)   { animation-name: slideOutLeft; }
::view-transition-new(.slide-in)   { animation-name: slideInRight; }
```

## Luồng hoạt động (Flow)
1. Bạn gọi `startTransition(() => setState(...))` (hoặc dùng `useDeferredValue`, hoặc Suspense reveal).
2. React commit DOM và gọi `startViewTransition` của browser: chụp snapshot "cũ".
3. React chờ font/ảnh cần thiết (tối đa **500ms** để tránh nhấp nháy), chạy `useLayoutEffect`/refs, rồi đo layout.
4. Browser morph ảnh cũ → ảnh mới. React gọi `onEnter/onExit/onShare/onUpdate` (nếu có) để bạn thêm animation JS.
5. Khi transition xong, React gọi cleanup; chỉ **sau** đó mới chạy các `useEffect` liên quan để không cản trở animation.

## Ví dụ chi tiết

```tsx
// example.tsx — gallery thumbnail ↔ ảnh lớn bằng shared element transition
import { ViewTransition, startTransition, useState } from 'react';

const PHOTOS = [
  { id: 'a', thumb: '/a-thumb.jpg', full: '/a-full.jpg' },
  { id: 'b', thumb: '/b-thumb.jpg', full: '/b-full.jpg' },
];

export default function Gallery() {
  const [selected, setSelected] = useState<string | null>(null);
  const photo = PHOTOS.find((p) => p.id === selected);

  return (
    <div>
      <h2>View Transitions (React 19.3)</h2>
      {!photo ? (
        // Grid: mỗi thumbnail là một ViewTransition có name riêng
        <div style={{ display: 'flex', gap: 12 }}>
          {PHOTOS.map((p) => (
            <ViewTransition key={p.id} name={`photo-${p.id}`}>
              <img
                src={p.thumb}
                alt={p.id}
                style={{ cursor: 'zoom-in' }}
                // BẮT BUỘC đổi state trong startTransition mới animate
                onClick={() => startTransition(() => setSelected(p.id))}
              />
            </ViewTransition>
          ))}
        </div>
      ) : (
        // Ảnh lớn dùng CÙNG name → React ghép thành shared element transition
        <ViewTransition name={`photo-${photo.id}`}>
          <img
            src={photo.full}
            alt={photo.id}
            style={{ cursor: 'zoom-out' }}
            onClick={() => startTransition(() => setSelected(null))}
          />
        </ViewTransition>
      )}
      <p><small>Browser hỗ trợ View Transitions sẽ thấy ảnh morph to/nhỏ dần.</small></p>
    </div>
  );
}
```

## Giải thích từng phần
- `ViewTransition` + `startTransition` import từ `react`; **không** import `startViewTransition` — React tự lo.
- Hai `<ViewTransition name={`photo-${id}`}>` ở hai nhánh dùng **cùng name** → khi nhánh này unmount và nhánh kia mount trong cùng một Transition, React tạo **share** animation (thumbnail morph thành ảnh lớn).
- `onClick={() => startTransition(() => setSelected(p.id))}`: nếu bỏ `startTransition`, đây là update urgent → React **không** animate. Đây là điểm dễ sai nhất.
- `key={p.id}` trên từng thumbnail: giữ identity ổn định để React biết phần tử nào enter/exit khi danh sách đổi.
- File `example.tsx` kèm theo là bản rút gọn minh họa cùng ý tưởng; API chuẩn (dùng ở trên) là `<ViewTransition>` + `startTransition`, **không** có `startViewTransition` export từ `react`.

## So sánh với cách làm cũ

| Khía cạnh | Cách cũ (FLIP/`document.startViewTransition` tay) | React 19.3 |
|---|---|---|
| Đo vị trí trước/sau | Tự `getBoundingClientRect`, tính transform | React lo, chỉ cần bọc `<ViewTransition>` |
| Đồng bộ với Suspense | Rất khó (DOM đổi bất đồng bộ) | Tích hợp sẵn, chờ data/font/ảnh |
| Gọi API browser | Tự gọi `startViewTransition` | React gọi nội bộ, không gọi tay |
| Chọn animation theo hành động | Tự quản state + class | `addTransitionType` + class object |
| Animation JS | Tự viết | Event props + Web Animations API |

## Lỗi thường gặp
1. **Đặt DOM node trước `<ViewTransition>`** → enter/exit không chạy. Vì sao: React chỉ animate enter/exit nếu `<ViewTransition>` là thứ đầu tiên trong subtree. Fix: đưa `<ViewTransition>` lên trước mọi `<div>`.
2. **Đổi state ngoài Transition** → không thấy animation. Vì sao: update urgent không qua pipeline transition. Fix: bọc trong `startTransition`/`useDeferredValue`.
3. **Đặt `name` trùng ở hai nơi cùng lúc** → xung đột shared element, animation sai. Vì sao: tại một thời điểm chỉ được có một element mang một `name`. Fix: dùng name unique (hằng số ở module dùng chung).
4. **Quên `prefers-reduced-motion`** → người dùng nhạy cảm chuyển động bị khó chịu. Vì sao: React không tự tắt animation. Fix: bọc CSS trong `@media (prefers-reduced-motion: reduce)` để tắt/giảm.
5. **Tưởng `name` dùng để animate reorder list** → không chạy như mong đợi. Vì sao: reorder nên dùng **key**, còn shared element bị bỏ qua nếu một bên ngoài viewport. Fix: dùng `key` ổn định và để `<ViewTransition>` bao quanh từng item.

## Khi nào dùng / Khi nào không
- **Dùng**: gallery expand, tab/carousel switch, route transition, list → detail, reveal dữ liệu từ Suspense, phối hợp với `<Activity>` (enter khi visible, exit khi hidden).
- **Không dùng**: update urgent cần phản hồi tức thì; hiệu ứng chỉ nhằm trang trí không mang thông tin; khi cần chạy trên React Native (hiện `<ViewTransition>` **chỉ hỗ trợ DOM**); hoặc khi bạn đã có thư viện animation chuyên sâu (Motion) đang đáp ứng tốt.

## Bài tập nhỏ
- Dựng một carousel 3 slide. Thêm hai nút ⬅️/➡️, mỗi nút gọi `startTransition(() => { addTransitionType('previous'|'next'); setSlide(...) })`. Bọc slide trong `<ViewTransition enter={{next:'from-right',previous:'from-left'}} exit={{next:'to-left',previous:'to-right'}} default="none">` và viết CSS cho các class tương ứng. Kiểm tra: bấm tới/lùi thấy slide trượt đúng hướng, và slide không animate khi state đổi ngoài Transition.

## Reference
- [React 19.3 Release — View Transitions](https://react.dev/blog/2026/09/09/react-19-3)
- [<ViewTransition> reference](https://react.dev/reference/react/ViewTransition)
- [addTransitionType](https://react.dev/reference/react/addTransitionType)
- [MDN — View Transition API](https://developer.mozilla.org/en-US/docs/Web/API/View_Transitions_API)
