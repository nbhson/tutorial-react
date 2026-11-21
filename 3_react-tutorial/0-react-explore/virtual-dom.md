# Virtual DOM + Reconciliation (Track hiện đại)

> Bài bổ sung cho `3_react-tutorial/0-react-explore`: hiểu đúng Virtual DOM trong React 19 + Compiler 1.0.
> Đọc kèm: `README.md` (entry/Vite) + `question-answer.md` (Q&A DAY 0).

Nghe ai đó nói "React nhanh nhờ Virtual DOM" nhưng chưa rõ nó là gì? Bài này mổ xẻ chính xác: Virtual DOM là cây object JS mô tả UI, còn reconciliation là thuật toán "soi khác biệt" — hiểu hai thứ này là hiểu vì sao React bắt bạn đổi state thay vì sờ DOM tay.

## Mục tiêu

Mục này nêu 4 đích của bài. Đọc để biết sau bài này bạn giải thích được gì cho đồng nghiệp.

- Hiểu Virtual DOM là gì (object JS mô tả UI) và **không phải** DOM thật.
- Nắm luồng **reconciliation**: state đổi → render mới → diff cũ/mới → patch đúng node.
- Biết vai trò của **key** trong list và vì sao ref tự sửa DOM phá vỡ diff.
- Hiểu vị trí của Virtual DOM trong React 19 + Compiler (Compiler giảm render thừa, không thay reconciliation).

> **Tóm gọn 1 câu:** Sau bài này bạn hiểu đúng cả 3 lớp: Virtual DOM là gì, diff diễn ra thế nào, và React 19 + Compiler "chạm" vào chỗ nào của bức tranh đó.

## Khái niệm cốt lõi

Mục này định nghĩa 5 khái niệm nền của bài. Đọc tuần tự — mỗi khái niệm dựng trên khái niệm trước.

- **Virtual DOM = cây object JS nhẹ** mô tả UI (`{ type, props, children }`), được tạo ra mỗi khi function
  component chạy. React giữ 2 bản: cây cũ (đang hiển thị) và cây mới (vừa render).
- **Reconciliation = thuật toán diff**: so sánh 2 cây để tìm node khác biệt, rồi chỉ vá đúng chỗ đó trong DOM thật.
  DOM thật đắt (layout/paint), object JS rẻ — nên "render lại cả cây trong bộ nhớ rồi vá ít" nhanh hơn "sờ DOM trực tiếp".
- **Render thuần khiết là điều kiện tiên quyết:** cùng props/state → cùng JSX. Nhờ vậy React render lại bao nhiêu
  lần cũng an toàn, StrictMode ở dev mới dám chạy 2 lần để kiểm tra.
- **Key là "căn cước" của node trong list:** khi thêm/xóa/đổi thứ tự, React so theo key để biết "phần tử nào là
  phần tử nào". Thiếu key hoặc key trùng/index bừa bãi → giữ nhầm state, DOM nhầm chỗ.
- **React 19 + Compiler không bỏ Virtual DOM:** Compiler chỉ **giảm số lần render thừa** (tự memoize ở build-time);
  khi đã render thì reconciliation/diff vẫn diễn ra như cũ.

Ví von tổng quát: Virtual DOM như **bản vẽ thiết kế** còn DOM thật là **ngôi nhà đang ở** — muốn sửa nhà, kiến trúc sư vẽ lại bản vẽ (rẻ, vài giây), so bản cũ với bản mới, rồi chỉ đập đúng bức tường khác biệt — chứ không đập cả nhà xây lại.

> **Tóm gọn 1 câu:** Virtual DOM là bản vẽ rẻ trong bộ nhớ, reconciliation là bước soi khác biệt để chỉ vá đúng chỗ nhà thật — còn key là căn cước giúp React nhận diện đúng từng phần tử.

## Luồng hoạt động

Mục này là 6 bước vòng đời một lần cập nhật UI, từ mount đến patch. Đọc theo thứ tự từng bước — bước 4 (diff) là trái tim của bài.

1. Mount lần đầu: `.render(<App />)` → chạy `App()` → tạo cây Virtual DOM → dựng DOM thật vào `#root`.
2. User bấm nút → `setCount(c => c + 1)` → React schedule re-render.
3. React chạy lại `App()` → tạo **cây Virtual DOM mới** (object mới, chưa chạm DOM).
4. **Diff** cây mới với cây cũ (so theo `type`, props, và `key` trong list).
5. Chỉ node khác biệt được **patch** vào DOM thật (ví dụ chỉ text `<p>Count: 1</p>` đổi, nút bấm giữ nguyên).
6. Lặp lại từ bước 2 mỗi khi state/props/context đổi.

> 📄 **Code ví dụ:** [`examples/01-luong-hoat-ong.tsx`](examples/01-luong-hoat-ong.tsx)

> **Tóm gọn 1 câu:** 6 bước khép vòng: vẽ cây mới trong bộ nhớ → diff với cây cũ → vá đúng node khác — và vòng lặp lặp lại mỗi lần state đổi.

## Key trong list — ví dụ đúng/sai

Mục này nói về "căn cước" của phần tử trong list: vì sao `key` sai là state của item "nhảy" nhầm chỗ. Đọc để tránh lỗi list ẩn tiếng nhất của người mới.

> 📄 **Code ví dụ:** [`examples/02-key-trong-list-vi-du-ung-sai.tsx`](examples/02-key-trong-list-vi-du-ung-sai.tsx)

> **Tóm gọn 1 câu:** `key` là căn cước công dân của item — key bừa (index, trùng) thì React giữ nhầm state của người khác.

## Bảng so sánh Angular ↔ React

Mục này đối chiếu cách React và Angular xử lý cập nhật UI. Đọc nếu bạn đến từ Angular — hoặc để hiểu React "khác" ở điểm nào.

| Angular | React | Ghi chú |
|---|---|---|
| Digest cycle + dirty checking (Zone.js quét binding) | Re-render + diff Virtual DOM khi state đổi | React chủ động (báo qua setter), Angular nghe lén sự kiện |
| `trackBy` trong `*ngFor` | `key` trong `.map()` | Cùng mục đích: định danh phần tử khi diff |
| Thao tác DOM qua Renderer/Native | JSX mô tả UI, React vá DOM | Không sờ DOM tay trong render |

> **Cách đọc bảng này:** mỗi dòng là một cặp tương đương — cột giữa (React) là thứ bạn học trong bài, cột đầu giúp ai quen Angular "dịch" sang, cột Ghi chú nêu điểm khác biệt tinh tế nhất của cặp đó.

> **Tóm gọn 1 câu:** Angular nghe lén sự kiện rồi quét, React chờ chuông state rồi diff — `trackBy` và `key` là cùng một bài toán định danh, hai cách gọi tên.

## Lỗi thường gặp

Mục này liệt kê 4 hiểu lầm và lỗi kinh điển quanh Virtual DOM. Đọc để không đi lại đường mòn của người mới.

- **Tưởng JSX là DOM thật** → `ref.current.appendChild(...)` trong render. → Fix: mô tả UI bằng JSX/state, ref chỉ cho
  hành động imperative (focus, scroll, đo kích thước).
- **Key bằng index hoặc trùng** → xóa item đầu, input item sau giữ nhầm text. → Fix: `key={item.id}` ổn định.
- **Mutation trong render** (đẩy vào mảng ngoài, `count++`) → render 2 lần ở StrictMode cho kết quả khác nhau.
  → Fix: render thuần khiết, side-effect dời vào `useEffect`/event handler.
- **Nghĩ "render lại cả cây = chậm"** → `memo` bừa khắp nơi. → Fix: tin reconciliation (diff rẻ); chỉ `memo` sau khi đo,
  hoặc bật React Compiler để nó tự memoize.

Lỗi số 4 phổ biến ở người có nền cũ: "render lại cả cây" nghe nguy hiểm nhưng thật ra chỉ là **vẽ lại bản thiết kế trên giấy nháp** — rất rẻ; đắt là sờ vào ngôi nhà thật, và React đã giúp bạn sờ ít nhất có thể.

> **Tóm gọn 1 câu:** Bốn lỗi đều chung gốc: hiểu sai "cái gì rẻ, cái gì đắt" — vẽ cây rẻ, sờ DOM đắt, và mọi fix đều hướng về render thuần khiết + key ổn định.

## Best practices

Mục này chốt các thói quen nên giữ khi làm việc với Virtual DOM. Đọc để biến hiểu biết thành phản xạ.

- Giữ render thuần khiết: không đọc/ghi biến ngoài, không mutation, cùng input → cùng JSX.
- `key` ổn định + duy nhất trong list; không dùng index trừ list tĩnh không bao giờ đổi thứ tự.
- Cập nhật UI bằng state/props, không vá DOM tay trong render.
- Bật React Compiler từ đầu thay vì `memo` thủ công tràn lan (chi tiết: `4_react-new-feature/5_react-compiler`).

> **Tóm gọn 1 câu:** Bốn thói quen vàng: render thuần khiết, key ổn định, đổi state thay vì vá DOM, và để Compiler tự lo memo.

## Bài tập nhỏ

1. Thêm `console.log("render Counter")` trong `Counter`, bấm Tăng và quan sát: function chạy lại cả cây nhưng DOM
   thật chỉ đổi node `<p>`. Kiểm tra bằng DevTools Elements.
2. Tạo list 3 input có state nội bộ, thử `key={index}` rồi xóa item đầu → quan sát text "nhảy" sai. Sửa thành
   `key={id}` và so sánh.
3. Bỏ `<StrictMode>` rồi để lại, so sánh số lần log — giải thích vì sao prod không bị ảnh hưởng.

## Reference
- https://react.dev/learn/preserving-and-resetting-state (key + state)
- https://react.dev/learn/render-and-commit (render → commit → DOM)
- https://react.dev/learn/react-compiler
- Bài legacy chi tiết: `1_react-legacy-tutorial/1_overview/README.md` (mục Virtual DOM)
- Key trong list: `1_react-legacy-tutorial/2_detail/1_basic/11_lists-keys/README.md`
