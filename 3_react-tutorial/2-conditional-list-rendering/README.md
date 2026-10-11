# DAY 2: RENDER CÓ ĐIỀU KIỆN & DANH SÁCH

## Mục tiêu bài học
- Xóa hẳn khái niệm directive: React không có `*ngIf`/`*ngFor`/`@if`/`@for` — mọi rẽ nhánh và lặp đều là JS thuần trong JSX.
- Thành thạo 3 kỹ thuật điều kiện: early `return`, `&&`, `?:` — biết chọn đúng cho từng tình huống.
- Hiểu vì sao `key` bắt buộc trong list, và vì sao không dùng `key={index}` khi list thay đổi.

## Khái niệm cốt lõi (Core)
- **JSX chỉ là expression** — nên "render có điều kiện" không cần cú pháp mới: bạn dùng đúng cú pháp rẽ nhánh của JS trên *giá trị JSX*. Angular cần directive vì template không phải JS; React không cần vì JSX là JS.
- **`&&` cho nhánh "có/không"**: `{unread > 0 && <span/>}` — về bản chất là `cond && (giá trị render)`. Cạm bẫy: nếu số hạng trái là số 0 hoặc chuỗi rỗng, kết quả trả về chính nó và React in ra "0"/"".
- **`?:` cho 2 nhánh**: ternary luôn trả về một trong hai giá trị — dùng khi cả 2 nhánh đều có nội dung.
- **Early return** khi rẽ cả component: đặt logic lọc/điều kiện đầu function, `return` sớm giúp phần sau không phải lồng sâu.
- **`key` là identity cho reconciliation**: React dùng key để biết element nào giữ nguyên, nào thêm/xóa/di chuyển. Key tốt = id ổn định; key xấu = `index` khi list sắp xếp/xóa giữa → sai state, sai vị trí, sai animation.
- **`.map()` biến mảng dữ liệu thành mảng JSX.** JSX render mảng trực tiếp được (React tự gắn vào cây theo key).
- **Lọc/sắp xếp/biến đổi nên làm trước JSX** (ra biến) để phần return đọc như HTML.
- **Render mảng:** JSX chấp nhận mảng element; React nối chúng vào cây theo thứ tự, dùng `key` để nhận diện giữa các lần render.
- **Falsy không phải lúc nào cũng "không render":** `0`, `""`, `NaN` là giá trị render được (khác `null`/`false`/`undefined` bị bỏ qua).
- **Keyword chính:** `conditional rendering`, `&&`, `ternary`, `early return`, `key`, `.map()`, `reconciliation`, `track` (Angular) ↔ `key` (React).

## Luồng hoạt động (Flow)
1. Component `App` render: đọc `isLogin`.
2. Nếu `isLogin === false`, function `return` ngay `<p>Vui lòng đăng nhập.</p>` → không tính tiếp phần còn lại.
3. Nếu `isLogin === true`: gọi `TODOS.filter((t) => !t.done)` → mảng `pending` chỉ còn việc chưa hoàn thành.
4. JSX đánh giá `pending.length === 0 ? A : B`.
5. Nếu rỗng → render `<li>Hoàn thành tất cả!</li>`.
6. Ngược lại → `.map()` chạy từng phần tử, trả về mảng `<li key={id}>` → JSX nhận mảng element.
7. React diff cây cũ (lần render trước) với cây mới: cùng vị trí + cùng key → **giữ nguyên** (chỉ cập nhật text nếu đổi).
8. Key mới xuất hiện → tạo element/khởi tạo state mới tương ứng.
9. Key biến mất → unmount element và cleanup state của nó.
10. Key đổi vị trí → React **di chuyển** node DOM thay vì tạo lại → giữ state (input đang gõ, animation).
11. Re-render chỉ cập nhật đúng phần khác biệt vào DOM (không dựng lại toàn bộ).
12. Nếu key là index: khi thêm/xóa phần tử đầu, index dịch chuyển → React tưởng "cùng item" → state nhảy sai chỗ.
13. `key` ổn định (id) giúp React **chỉ di chuyển/node giữ nguyên state** thay vì dựng lại — mượt hơn và ít tốn kém.
14. Kết quả cuối: React commit danh sách mới vào DOM, giữ nguyên những node không đổi.

## Ví dụ chi tiết
```tsx
// example.tsx — DAY 2: conditional + list
type Todo = { id: number; text: string; done: boolean };

const TODOS: Todo[] = [
  { id: 1, text: "Hoc JSX", done: true },
  { id: 2, text: "Hoc hooks", done: false },
  { id: 3, text: "Build Vite app", done: false },
];

export default function App({ isLogin = true }: { isLogin?: boolean }) {
  // Early return: chặn toàn bộ phần render nếu chưa đăng nhập
  if (!isLogin) return <p>Vui lòng đăng nhập.</p>;

  // Lọc trước khi render: mảng pending chỉ chứa việc chưa xong
  const pending = TODOS.filter((t) => !t.done);

  return (
    <ul>
      {/* Ternary: đủ 2 nhánh (rỗng / có dữ liệu) */}
      {pending.length === 0 ? (
        <li>Hoàn thành tất cả!</li>
      ) : (
        /* .map() biến mảng dữ liệu -> mảng JSX; key = id ổn định */
        pending.map((t) => <li key={t.id}>{t.text}</li>)
      )}
    </ul>
  );
}
```

Các pattern điều kiện khác hay dùng:

```tsx
// 1) Chỉ hiện khi đúng: dùng điều kiện boolean (không phải số)
{unread > 0 && <span>Bạn có {unread} tin nhắn</span>}

// 2) Nhiều nhánh: object map sạch hơn switch lồng
const label = { admin: "Quản trị", user: "Thành viên" }[role];

// 3) Trả về null khi không muốn render gì
if (!visible) return null;
```

## Giải thích từng phần
- `if (!isLogin) return <p>...</p>`: **early return** — sạch hơn ternary lồng nhiều tầng; phần code sau return chỉ chạy khi đã vượt qua.
- `TODOS.filter(...)`: xử lý dữ liệu trong component body (không phải template) rồi mới render — đúng tư duy "logic là JS, JSX là output".
- `pending.length === 0 ? ... : ...`: ternary trong JSX. Gộp cả "rỗng" và "có dữ liệu" gọn hơn hai mảnh `&&` + text mặc định.
- `key={t.id}`: không có key → React cảnh báo console và dùng index ngầm. Với list xóa/sắp xếp → DOM tái sử dụng sai chỗ.
- `{unread > 0 && ...}`: so sánh > 0 trả boolean — tránh in "0" nếu unread = 0.
- Object map `{...}[role]`: thay `switch` làm JSX sạch hơn khi nhiều nhánh text/ảnh.
- `return null`: tương đương "không render gì" — vẫn mount component nhưng không có DOM.
- `pending.map(...)` trả mảng; React render mảng theo thứ tự, dùng key để diff.
- Fragment/lồng: có thể đặt JSX trong JSX không giới hạn; mỗi tầng là một function call.
- `filter` rồi `map` là hai bước độc lập: lọc giảm số node, map tạo node — tách ra dễ đọc và dễ test.
- **`key` không phải prop truyền xuống con:** React tiêu thụ nó cho việc diff; con không đọc được `props.key`.
- Với list lớn, `sort` tạo mảng mới — không mutate mảng gốc (tránh bug khi mảng là state/props).
- Nếu một item cần id dự phòng, tạo khi nhận dữ liệu (`{...t, key: crypto.randomUUID()}`) — đừng để index.
- `return null` khác `return false`? Cả hai đều không render, nhưng dùng `null` rõ nghĩa hơn.

## Bảng so sánh Angular ↔ React
| Angular | React | Ghi chú |
|---|---|---|
| `*ngIf="cond"` (cũ) / `@if (cond)` | `{cond && <X/>}` hoặc `cond ? <A/> : <B/>` | `@if` có else; ternary tương đương |
| `@if ... @else` | `cond ? <A/> : <B/>` | Không có block, chỉ expression |
| `*ngFor="let t of todos"` / `@for (t of todos; track t.id)` | `todos.map(t => <li key={t.id}>...)` | Angular `track` ↔ React `key` |
| `@empty` block | ternary nhánh rỗng / kiểm `length === 0` | Không có cú pháp riêng |
| `*ngSwitch`/`@switch` | `switch` trong function hoặc object map | Object map gọn hơn |
| `*ngIf="x as y"` | `x ? render(y) : null` | Không có "as" binding |
| `ng-template` + `ngTemplateOutlet` | render props (DAY 6) | Render linh hoạt |
| Structural directive tùy biến | Hàm/component nhận điều kiện | React không có macro template |
| `*ngIf` với async pipe | `use()` + Suspense (DAY 12) | Đọc promise trong render |
| `ngFor` lồng `ngIf` | `filter(...).map(...)` | Xử lý data trước khi render |

## Lỗi thường gặp (Common pitfalls)
- **`{count && <X/>}` khi `count = 0`** → hiện "0" lạc lõng. → Fix: dùng boolean `{count > 0 && ...}`.
- **`key={index}` cho list có xóa/sắp xếp** → item tái sử dụng sai → state (ô input, ảnh) nhảy lung tung. → Fix: dùng id ổn định.
- **Key trùng nhau trong cùng list** → React cảnh báo + diffing sai. → Fix: đảm bảo unique; nếu dữ liệu không có id, sinh id ổn định khi nhận.
- **Lọc/sắp xếp ngay trong JSX** → đoạn return dài khó đọc. → Fix: tính mảng ra biến như ví dụ.
- **Dùng `switch` statement trong JSX** → lỗi cú pháp. → Fix: tách hàm render hoặc object map.
- **`&&` với chuỗi** (`{name && <X/>}` khi name = ""`) → in chuỗi rỗng ra DOM (thường vô hình nhưng gây lỗi layout). → Fix: so boolean.
- **Quên `key`** → warning "Each child in a list should have a unique key prop". → Fix: luôn có key cho `.map`.
- **Trả `undefined` thay `null`** → warning. → Fix: `return null`.
- **Nhầm index trong `@for` của Angular với React** → `$index` ↔ `(item, index)` nhưng thứ tự tham số khác. → Fix: `map((item, index) => ...)`.
- **Dùng `Object.entries` rồi `.map` mà quên key** → warning. → Fix: key = key của object.
- **Mutate mảng bằng `.sort()`/`.reverse()` trong render** → sửa state/props gián tiếp, gây bug khó tìm. → Fix: `[...arr].sort()`, `toSorted()`.

## Best practices / Mẹo
- **Phân loại 3 cấp điều kiện:** `&&` (ẩn/hiện 1 món), `?:` (2 nhánh nội dung), early `return` (chặn cả component).
- Đưa **điều kiện phức tạp ra biến đặt tên tốt**: `const isOutOfQuota = pending.length > 5;` rồi dùng trong JSX.
- Kết hợp với DAY 1: nếu bạn cần `if`, hãy đưa lên trước `return`, không nhét vào JSX.
- Với danh sách lớn, xem `key` + `memo` (DAY 10) + virtualization; ưu tiên đúng key trước.
- `Children` API (DAY 9) khi cần đếm/chỉnh children trực tiếp.
- Dùng `key` để **reset component có state nội bộ** khi đối tượng đổi: `<Profile key={userId} userId={userId} />`.
- Đặt một `key` dự phòng ở tầng cao khi list có thể đổi identity (ví dụ đổi filter → remount list).
- Dùng `toSorted`/`toReversed` (ES2023) để không mutate mảng gốc — an toàn cho state.
- Tránh đặt logic `filter+map` phức tạp trong JSX; tách thành biến `const rows = ...` ngay trên `return`.
- Nếu một list tái sử dụng nhiều nơi, tách component `TodoList` nhận `todos` + `onToggle` (DAY 3).

## Bài tập nhỏ
1. Mở rộng `App`: thêm nút "Toggle trạng thái" cho từng todo (click → đảo `done`) giữ `key={t.id}` — quan sát UI đúng phần tử đổi. Đổi tạm sang `key={index}` và click liên tục để thấy lỗi state nhảy.
2. Thay ternary `pending.length === 0` bằng 2 nhánh `{pending.length > 0 && ...}` + `<p>Chưa có việc nào.</p>` — so sánh độ đọc.
3. Thêm nhánh hiển thị theo `role`: `admin` → "Quản trị", `user` → "Thành viên" bằng object map thay `switch`.
4. Thêm bộ lọc `all | active | done` truyền prop `filter` và lọc trước khi `.map`.
5. Thêm "empty state" riêng cho từng filter (vd filter `done` rỗng → "Chưa hoàn thành việc nào").

## Reference
- https://react.dev/learn/conditional-rendering
- https://react.dev/learn/rendering-lists
- https://react.dev/learn/understanding-reconciliation
- https://react.dev/learn/preserving-and-resetting-state