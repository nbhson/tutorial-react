# Virtual DOM + Reconciliation (Track hiện đại)

> Bài bổ sung cho `3_react-tutorial/0-react-explore`: hiểu đúng Virtual DOM trong React 19 + Compiler 1.0.
> Đọc kèm: `README.md` (entry/Vite) + `question-answer.md` (Q&A DAY 0).

## Mục tiêu
- Hiểu Virtual DOM là gì (object JS mô tả UI) và **không phải** DOM thật.
- Nắm luồng **reconciliation**: state đổi → render mới → diff cũ/mới → patch đúng node.
- Biết vai trò của **key** trong list và vì sao ref tự sửa DOM phá vỡ diff.
- Hiểu vị trí của Virtual DOM trong React 19 + Compiler (Compiler giảm render thừa, không thay reconciliation).

## Khái niệm cốt lõi
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

## Luồng hoạt động
1. Mount lần đầu: `.render(<App />)` → chạy `App()` → tạo cây Virtual DOM → dựng DOM thật vào `#root`.
2. User bấm nút → `setCount(c => c + 1)` → React schedule re-render.
3. React chạy lại `App()` → tạo **cây Virtual DOM mới** (object mới, chưa chạm DOM).
4. **Diff** cây mới với cây cũ (so theo `type`, props, và `key` trong list).
5. Chỉ node khác biệt được **patch** vào DOM thật (ví dụ chỉ text `<p>Count: 1</p>` đổi, nút bấm giữ nguyên).
6. Lặp lại từ bước 2 mỗi khi state/props/context đổi.

```tsx
// Mỗi lần count đổi, chỉ <p> bị vá — <button> giữ nguyên trong DOM thật
function Counter() {
  const [count, setCount] = useState(0);
  return (
    <>
      <p>Count: {count}</p>
      <button onClick={() => setCount((c) => c + 1)}>Tăng</button>
    </>
  );
}
```

## Key trong list — ví dụ đúng/sai

```tsx
// ĐÚNG — key ổn định theo id
{posts.map((p) => <PostCard key={p.id} post={p} />)}

// SAI — index làm key: xóa/đảo thứ tự sẽ giữ nhầm state nội bộ
{posts.map((p, i) => <PostCard key={i} post={p} />)}

// SAI — tự sửa DOM bằng ref mỗi lần state đổi: phá vỡ diff
ref.current.textContent = count; // ❌ hãy để {count} trong JSX lo
```

## Bảng so sánh Angular ↔ React
| Angular | React | Ghi chú |
|---|---|---|
| Digest cycle + dirty checking (Zone.js quét binding) | Re-render + diff Virtual DOM khi state đổi | React chủ động (báo qua setter), Angular nghe lén sự kiện |
| `trackBy` trong `*ngFor` | `key` trong `.map()` | Cùng mục đích: định danh phần tử khi diff |
| Thao tác DOM qua Renderer/Native | JSX mô tả UI, React vá DOM | Không sờ DOM tay trong render |

## Lỗi thường gặp
- **Tưởng JSX là DOM thật** → `ref.current.appendChild(...)` trong render. → Fix: mô tả UI bằng JSX/state, ref chỉ cho
  hành động imperative (focus, scroll, đo kích thước).
- **Key bằng index hoặc trùng** → xóa item đầu, input item sau giữ nhầm text. → Fix: `key={item.id}` ổn định.
- **Mutation trong render** (đẩy vào mảng ngoài, `count++`) → render 2 lần ở StrictMode cho kết quả khác nhau.
  → Fix: render thuần khiết, side-effect dời vào `useEffect`/event handler.
- **Nghĩ "render lại cả cây = chậm"** → `memo` bừa khắp nơi. → Fix: tin reconciliation (diff rẻ); chỉ `memo` sau khi đo,
  hoặc bật React Compiler để nó tự memoize.

## Best practices
- Giữ render thuần khiết: không đọc/ghi biến ngoài, không mutation, cùng input → cùng JSX.
- `key` ổn định + duy nhất trong list; không dùng index trừ list tĩnh không bao giờ đổi thứ tự.
- Cập nhật UI bằng state/props, không vá DOM tay trong render.
- Bật React Compiler từ đầu thay vì `memo` thủ công tràn lan (chi tiết: `4_react-new-feature/5_react-compiler`).

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
