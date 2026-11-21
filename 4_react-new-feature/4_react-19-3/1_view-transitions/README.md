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

Mục này nói về khoảng trống giữa "browser có View Transition API" và "React biết lúc nào commit" — chỗ mà tự làm FLIP từng là cơn ác mộng. Đọc để hiểu vì sao component khai báo là lời giải.

- Chuyển gallery/tab/route muốn hiệu ứng morph (ảnh nhỏ → ảnh lớn) kiểu app native. Tự làm FLIP (First–Last–Invert–Play) rất cực: phải đo vị trí trước/sau, xử lý Suspense thay DOM bất đồng bộ, dễ nhấp nháy. Ví von: như tự quay phim từng khung hình để làm cảnh chuyển tiếp, trong khi máy quay của trình duyệt đã có sẵn — React giờ điều khiển máy quay đó hộ bạn.
- View Transition API của browser giải quyết phần "chụp và morph", nhưng dùng trực tiếp rất khó đồng bộ với React (chụp lúc nào, commit lúc nào). `<ViewTransition>` để React điều phối và gắn chặt với pipeline Transition/Suspense.

## Khái niệm cốt lõi

Mục này là "bảng phân loại cảnh quay": 4 loại animation, cách đặt `name` cho shared element, và 2 cách tùy biến (CSS class hoặc event props). Hãy hình dung như 4 cú máy khác nhau — vào khung (enter), ra khung (exit), đổi hình trong khung (update), và nối máy hai khung (share).

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

> **Tóm gọn 1 câu:** `<ViewTransition>` là "đạo diễn hiệu ứng" khai báo: bọc là có animation, `name` để nối hai khung, `addTransitionType` để nói "vì sao" chuyển cảnh — React lo phần chụp và morph.

## Cú pháp / API

> 📄 **Code ví dụ:** [`examples/01-cu-phap-api.tsx`](examples/01-cu-phap-api.tsx)

CSS tùy biến dùng pseudo-selector với class của View Transition Class:

> 📄 **Code ví dụ:** [`examples/02-cu-phap-api.css`](examples/02-cu-phap-api.css)

## Luồng hoạt động (Flow)

Mục này đi qua 5 bước "một cảnh quay": từ startTransition tới cleanup, cho thấy React chèn View Transition API vào pipeline ở khâu nào.

1. Bạn gọi `startTransition(() => setState(...))` (hoặc dùng `useDeferredValue`, hoặc Suspense reveal).
2. React commit DOM và gọi `startViewTransition` của browser: chụp snapshot "cũ".
3. React chờ font/ảnh cần thiết (tối đa **500ms** để tránh nhấp nháy), chạy `useLayoutEffect`/refs, rồi đo layout.
4. Browser morph ảnh cũ → ảnh mới. React gọi `onEnter/onExit/onShare/onUpdate` (nếu có) để bạn thêm animation JS.
5. Khi transition xong, React gọi cleanup; chỉ **sau** đó mới chạy các `useEffect` liên quan để không cản trở animation.

> **Tóm gọn 1 câu:** Chỉ update đi làn Transition mới được "quay phim" — snapshot cũ/mới do browser chụp, còn thứ tự chờ data, chạy effect thì React biên đạo.

## Ví dụ chi tiết

> 📄 **Code ví dụ:** [`examples/03-vi-du-chi-tiet.tsx`](examples/03-vi-du-chi-tiet.tsx)

## Giải thích từng phần
- `ViewTransition` + `startTransition` import từ `react`; **không** import `startViewTransition` — React tự lo.
- Hai `<ViewTransition name={`photo-${id}`}>` ở hai nhánh dùng **cùng name** → khi nhánh này unmount và nhánh kia mount trong cùng một Transition, React tạo **share** animation (thumbnail morph thành ảnh lớn).
- `onClick={() => startTransition(() => setSelected(p.id))}`: nếu bỏ `startTransition`, đây là update urgent → React **không** animate. Đây là điểm dễ sai nhất.
- `key={p.id}` trên từng thumbnail: giữ identity ổn định để React biết phần tử nào enter/exit khi danh sách đổi.
- File `example.tsx` kèm theo là bản rút gọn minh họa cùng ý tưởng; API chuẩn (dùng ở trên) là `<ViewTransition>` + `startTransition`, **không** có `startViewTransition` export từ `react`.

## So sánh với cách làm cũ

Bảng dưới đặt FLIP "thủ công" cạnh component khai báo. Đọc theo hàng: mỗi dòng là một phần việc bạn từng tự viết.

| Khía cạnh | Cách cũ (FLIP/`document.startViewTransition` tay) | React 19.3 |
|---|---|---|
| Đo vị trí trước/sau | Tự `getBoundingClientRect`, tính transform | React lo, chỉ cần bọc `<ViewTransition>` |
| Đồng bộ với Suspense | Rất khó (DOM đổi bất đồng bộ) | Tích hợp sẵn, chờ data/font/ảnh |
| Gọi API browser | Tự gọi `startViewTransition` | React gọi nội bộ, không gọi tay |
| Chọn animation theo hành động | Tự quản state + class | `addTransitionType` + class object |
| Animation JS | Tự viết | Event props + Web Animations API |

> **Cách đọc bảng này:** bảng không có cột "Lợi ích" vì cột React 19.3 chính là phần lợi ích — so từng hàng với cột "Cách cũ" để thấy phần việc nào được gạch khỏi tay bạn.

## Lỗi thường gặp

Mục này là 5 lỗi "không thấy animation" thường gặp — nguyên nhân số một là đặt DOM node trước `<ViewTransition>` (số 1) hoặc đổi state ngoài Transition (số 2).
1. **Đặt DOM node trước `<ViewTransition>`** → enter/exit không chạy. Vì sao: React chỉ animate enter/exit nếu `<ViewTransition>` là thứ đầu tiên trong subtree. Fix: đưa `<ViewTransition>` lên trước mọi `<div>`.
2. **Đổi state ngoài Transition** → không thấy animation. Vì sao: update urgent không qua pipeline transition. Fix: bọc trong `startTransition`/`useDeferredValue`.
3. **Đặt `name` trùng ở hai nơi cùng lúc** → xung đột shared element, animation sai. Vì sao: tại một thời điểm chỉ được có một element mang một `name`. Fix: dùng name unique (hằng số ở module dùng chung).
4. **Quên `prefers-reduced-motion`** → người dùng nhạy cảm chuyển động bị khó chịu. Vì sao: React không tự tắt animation. Fix: bọc CSS trong `@media (prefers-reduced-motion: reduce)` để tắt/giảm.
5. **Tưởng `name` dùng để animate reorder list** → không chạy như mong đợi. Vì sao: reorder nên dùng **key**, còn shared element bị bỏ qua nếu một bên ngoài viewport. Fix: dùng `key` ổn định và để `<ViewTransition>` bao quanh từng item.

> **Tóm gọn 1 câu:** Không thấy animation? Kiểm tra 3 thứ trước: `<ViewTransition>` đứng đầu subtree chưa, update có nằm trong Transition không, và `name` có bị trùng không.

## Khi nào dùng / Khi nào không
- **Dùng**: gallery expand, tab/carousel switch, route transition, list → detail, reveal dữ liệu từ Suspense, phối hợp với `<Activity>` (enter khi visible, exit khi hidden).
- **Không dùng**: update urgent cần phản hồi tức thì; hiệu ứng chỉ nhằm trang trí không mang thông tin; khi cần chạy trên React Native (hiện `<ViewTransition>` **chỉ hỗ trợ DOM**); hoặc khi bạn đã có thư viện animation chuyên sâu (Motion) đang đáp ứng tốt.

## Bài tập nhỏ

Bài tập carousel là "bài kiểm tra tổng hợp": kết hợp `addTransitionType` với class object để slide trượt đúng hướng theo nút bấm.

- Dựng một carousel 3 slide. Thêm hai nút ⬅️/➡️, mỗi nút gọi `startTransition(() => { addTransitionType('previous'|'next'); setSlide(...) })`. Bọc slide trong `<ViewTransition enter={{next:'from-right',previous:'from-left'}} exit={{next:'to-left',previous:'to-right'}} default="none">` và viết CSS cho các class tương ứng. Kiểm tra: bấm tới/lùi thấy slide trượt đúng hướng, và slide không animate khi state đổi ngoài Transition.

> **Tóm gọn 1 câu:** Slide trượt đúng hướng theo nút bấm và "im lặng" khi state đổi ngoài Transition — nghĩa là bạn đã điều phối được cả nguyên nhân lẫn loại animation.

## Reference
- [React 19.3 Release — View Transitions](https://react.dev/blog/2026/09/09/react-19-3)
- [<ViewTransition> reference](https://react.dev/reference/react/ViewTransition)
- [addTransitionType](https://react.dev/reference/react/addTransitionType)
- [MDN — View Transition API](https://developer.mozilla.org/en-US/docs/Web/API/View_Transitions_API)
