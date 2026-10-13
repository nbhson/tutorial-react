# DAY 2: RENDER CÓ ĐIỀU KIỆN & DANH SÁCH

## Mục tiêu bài học
- Xóa hẳn khái niệm directive: React không có `*ngIf`/`*ngFor`/`@if`/`@for` — mọi rẽ nhánh và lặp đều là JS thuần trong JSX.
- Thành thạo 3 kỹ thuật điều kiện: early `return`, `&&`, `?:` — biết chọn đúng cho từng tình huống.
- Hiểu vì sao `key` bắt buộc trong list, và vì sao không dùng `key={index}` khi list thay đổi.

## Khái niệm cốt lõi (Core)

### 1. JSX chỉ là expression — không cần cú pháp mới cho rẽ nhánh
Angular cần directive (`*ngIf`, `@if`) vì template không phải JS — template là DSL phải học thêm. React không cần vì JSX là JS: bạn dùng đúng cú pháp rẽ nhánh của JS trên *giá trị JSX*.

```tsx
// Angular: phải học directive + microsyntax
// <div *ngIf="isLogin">Hi</div>  hoặc  @if (isLogin) { <div>Hi</div> }

// React: JS thuần — không học gì mới ngoài JS bạn đã biết
function App({ isLogin }: { isLogin: boolean }) {
  if (!isLogin) return <p>Vui lòng đăng nhập.</p>; // early return = "if" thường
  return <div>Hi</div>;
}
```

Vì sao? Vì `<div>Hi</div>` sau biên dịch chỉ là object. Rẽ nhánh object thì `if`/`?:`/`&&` của JS là đủ. Nếu bạn cố tìm `*ngIf` trong React, bạn đang mang tư duy template sang nơi không cần. Hệ quả thực tế: logic lọc/sắp xếp/rẽ nhánh nằm ở phần JS trên đầu component, phần `return` chỉ còn "vẽ" — code đọc như "chuẩn bị dữ liệu rồi in".

### 2. `&&` cho nhánh "có/không"
`{cond && <span/>}` nghĩa là "nếu cond đúng thì vẽ, sai thì không vẽ gì". Về bản chất là toán tử `&&` của JS: trả vế phải khi vế trái truthy, trả vế trái khi falsy.

```tsx
// example.tsx dùng pattern này cho dòng đếm:
{pending.length > 0 && <li>Bạn còn {pending.length} việc</li>}
// pending.length = 2 -> 2 > 0 là true -> vẽ <li>
// pending.length = 0 -> 0 > 0 là false -> React bỏ qua, không vẽ gì
```

Cạm bẫy nổi tiếng: nếu vế trái là số `0` hoặc chuỗi rỗng, `&&` trả về chính nó và React in ra "0"/"". Vì sao? Vì `0` và `""` là giá trị render được (khác `false`/`null`/`undefined` bị bỏ qua).

```tsx
// ❌ SAI: count = 0 -> hiện số 0 lạc lõng
const count = 0;
return <div>{count && <span>Có tin nhắn</span>}</div>; // vẽ "0"

// ✅ ĐÚNG: so sánh trả boolean — false bị bỏ qua đúng ý
return <div>{count > 0 && <span>Có {count} tin nhắn</span>}</div>; // vẽ nothing
```

Quy tắc: vế trái của `&&` luôn phải là boolean (`> 0`, `!== ""`, `!!value`), không để số/chuỗi thô.

### 3. `?:` cho 2 nhánh đều có nội dung
Ternary luôn trả về một trong hai giá trị — dùng khi cả 2 nhánh đều cần vẽ (rỗng/có dữ liệu, login/guest, admin/user).

```tsx
// example.tsx dùng ternary cho 2 nhánh rỗng/có dữ liệu:
{pending.length === 0 ? (
  <li>Hoàn thành tất cả!</li> // nhánh rỗng — empty state rõ ràng
) : (
  pending.map((t) => <li key={t.id}>{t.text}</li>) // nhánh có dữ liệu
)}
```

Vì sao không dùng 2x `&&` (`{empty && A}{!empty && B}`)? Vì ternary thể hiện "hai nhánh loại trừ nhau" rõ hơn, chỉ đánh giá một nhánh, và TypeScript hiểu kiểu union gọn. Khi có 3+ nhánh, đừng lồng ternary 3 tầng — dùng object map hoặc tách hàm (xem dưới).

```tsx
// Nhiều nhánh: object map sạch hơn switch/ternary lồng
const label = { admin: "Quản trị", user: "Thành viên" }[role] ?? "Khách";
// Hoặc early return từng nhánh ở đầu hàm — mỗi return một ý, không lồng sâu
if (role === "admin") return <AdminPanel />;
if (role === "user") return <UserPanel />;
return <GuestPanel />;
```

### 4. Early return khi rẽ cả component
Đặt logic lọc/điều kiện đầu function, `return` sớm. Phần sau không phải lồng sâu một tầng `if`.

```tsx
// example.tsx: chặn ngay khi chưa đăng nhập
if (!isLogin) return <p>Vui lòng đăng nhập.</p>;
// Mọi dòng sau (filter, map) chỉ chạy khi đã login — phẳng, không lồng
const pending = TODOS.filter((t) => !t.done);
return <ul>...</ul>;
```

Vì sao early return thắng ternary lồng? Vì ternary lồng 3 tầng (`a ? b ? c : d : e`) khó đọc, khó đặt breakpoint, khó test từng nhánh. Early return mỗi nhánh một `return`, dễ thêm log, dễ tách hàm. Một dạng nữa là `if (!visible) return null` — "không vẽ gì nhưng vẫn mount" (component tồn tại, chỉ không có DOM).

### 5. `key` là identity cho reconciliation
React dùng key để biết element nào giữ nguyên, nào thêm/xóa/di chuyển giữa các lần render. Key tốt = id ổn định từ dữ liệu (`t.id`). Key xấu = `index` khi list thêm/xóa/sắp xếp giữa → sai state, sai vị trí, sai animation.

```tsx
// ✅ ĐÚNG: key ổn định — xóa item đầu, các item còn lại giữ đúng state
pending.map((t) => <li key={t.id}>{t.text}</li>)

// ❌ SAI: key index — xóa item đầu, index dịch, React tưởng "cùng item"
pending.map((t, i) => <li key={i}>{t.text}</li>)
// Hậu quả: ô input đang gõ ở dòng 2 nhảy lên dòng 1, checkbox tick sai dòng
```

Cơ chế: mỗi render React so cây cũ/mới theo vị trí + key. Cùng key → giữ node DOM + state nội bộ (input đang gõ, animation đang chạy), chỉ cập nhật text đổi. Key mới → tạo node. Key mất → unmount + cleanup. Key đổi vị trí → di chuyển node thay vì tạo lại. Nếu key là index và bạn xóa phần tử đầu, mọi index dịch 1 — React tưởng mọi item đều "đổi nội dung" và tái sử dụng sai node. Nếu dữ liệu không có id, sinh id ổn định khi nhận dữ liệu (`crypto.randomUUID()`), không dùng index.

Chi tiết hay quên: **`key` không phải prop** — React tiêu thụ nó cho diff, component con không đọc được `props.key`. Muốn con biết id, truyền thêm prop `id={t.id}` riêng.

### 6. `.map()` biến mảng dữ liệu thành mảng JSX
JSX render mảng trực tiếp được: `pending.map(...)` trả mảng `<li>`, React nối vào cây theo thứ tự, dùng `key` để nhận diện.

```tsx
// Hai bước độc lập: filter giảm số node, map tạo node — tách ra dễ đọc/test
const pending = TODOS.filter((t) => !t.done); // bước 1: lọc (JS thuần)
return <ul>{pending.map((t) => <li key={t.id}>{t.text}</li>)}</ul>; // bước 2: vẽ
```

Vì sao lọc/sắp xếp trước JSX mà không làm ngay trong `return`? Vì `return` lẫn 3 tầng `filter().sort().map()` khó đọc, khó đặt tên biến trung gian (`pending`, `sorted`), khó test. Quy tắc: biến `const rows = ...` ngay trên `return`, JSX chỉ còn `{rows}`.

### 7. Falsy không phải lúc nào cũng "không render"
`null`/`false`/`undefined` bị bỏ qua (không vẽ gì). Nhưng `0`, `""`, `NaN` là giá trị render được — React in chúng ra DOM.

```tsx
// Bị bỏ qua (không vẽ): null, false, undefined, true
{false && <span/>} // nothing
{null} // nothing
// BỊ VẼ (gây bất ngờ): 0, "", NaN
{0} // vẽ "0"
{""} // vẽ text rỗng (vô hình nhưng vẫn là node, có thể lệch layout flex)
```

Vì sao cần nhớ? Vì pattern `{list.length && <List/>}` sẽ in "0" khi rỗng. Fix luôn là so boolean (`length > 0`). Với chuỗi, `{name && <X/>}` khi `name = ""` in chuỗi rỗng — thường vô hình nhưng vẫn tạo text node. Muốn chắc chắn, `{name !== "" && <X/>}` hoặc `{Boolean(name) && <X/>}`.

### Keyword chính
`conditional rendering`, `&&`, `ternary`, `early return`, `key`, `.map()`, `reconciliation`, `track` (Angular) ↔ `key` (React). Thêm `empty state`, `identity`, `immutable sort` khi đọc code thật.

## Luồng hoạt động (Flow)
1. Component `App` render: đọc prop `isLogin` (default `true`).
2. Nếu `isLogin === false`, function `return` ngay `<p>Vui lòng đăng nhập.</p>` → không tính tiếp `filter`/`map` phía dưới. Vì sao return sớm tiết kiệm? Vì bỏ qua toàn bộ tính toán list khi chưa cần.
3. Nếu `isLogin === true`: gọi `TODOS.filter((t) => !t.done)` → mảng `pending` chỉ còn việc chưa hoàn thành (2 item). `filter` tạo mảng mới, không sửa `TODOS` gốc.
4. JSX đánh giá `pending.length === 0 ? A : B`. Vì sao ternary ở đây? Vì hai nhánh loại trừ nhau (rỗng hoặc có), cần vẽ khác nhau hoàn toàn.
5. Nếu rỗng → render `<li>Hoàn thành tất cả!</li>` (empty state thân thiện thay vì `<ul>` trống).
6. Ngược lại → `.map()` chạy từng phần tử, trả về mảng `<li key={id}>` → JSX nhận mảng element, React nối vào `<ul>`.
7. Dòng `{pending.length > 0 && <li>Bạn còn ...</li>}` đánh giá tiếp: `2 > 0` là `true` → vẽ thêm dòng đếm.
8. React diff cây cũ (lần render trước) với cây mới: cùng vị trí + cùng key → **giữ nguyên** node DOM (chỉ cập nhật text nếu đổi).
9. Key mới xuất hiện → tạo element/khởi tạo state mới tương ứng. Key biến mất → unmount element và cleanup state của nó.
10. Key đổi vị trí → React **di chuyển** node DOM thay vì tạo lại → giữ state (input đang gõ, animation đang chạy) — mượt và ít tốn kém.
11. Re-render chỉ cập nhật đúng phần khác biệt vào DOM (không dựng lại toàn bộ `<ul>`).
12. Nếu key là index: khi thêm/xóa phần tử đầu, index dịch chuyển → React tưởng "cùng item đổi nội dung" → state nhảy sai chỗ (input/checkbox nhảy dòng).
13. `key` ổn định (id) giúp React **chỉ di chuyển node giữ nguyên state** — đúng hành vi người dùng mong đợi.
14. Kết quả cuối: React commit danh sách mới vào DOM, giữ nguyên những node không đổi — không nhấp nháy, không mất focus.

## Ví dụ chi tiết
Code dưới đây khớp 1-1 với `example.tsx` cùng thư mục:

```tsx
// example.tsx — DAY 2: conditional + list (JS thuần thay *ngIf/*ngFor)
// Mục đích: chứng minh React không cần directive — rẽ nhánh và lặp đều là JS
// trên giá trị JSX. key ổn định là identity cho reconciliation.
type Todo = { id: number; text: string; done: boolean }; // (1) Type item — id ổn định làm key

// (2) Dữ liệu tĩnh demo: 1 việc xong + 2 việc chưa xong để filter có cái lọc
const TODOS: Todo[] = [
  { id: 1, text: "Hoc JSX", done: true },
  { id: 2, text: "Hoc hooks", done: false },
  { id: 3, text: "Build Vite app", done: false },
];

// (3) Prop isLogin default true — minh họa early return khi chưa đăng nhập
export default function App({ isLogin = true }: { isLogin?: boolean }) {
  // (4) Early return: chặn toàn bộ render nếu chưa đăng nhập — sạch hơn ternary lồng.
  // Phần code sau return chỉ chạy khi đã vượt qua điều kiện này.
  if (!isLogin) return <p>Vui lòng đăng nhập.</p>;

  // (5) Lọc trước khi render: logic là JS trên đầu hàm, JSX ở dưới chỉ "vẽ".
  // pending chỉ chứa việc chưa xong — tách filter khỏi map để dễ đọc/test.
  const pending = TODOS.filter((t) => !t.done);

  return (
    <ul>
      {/* (6) Ternary đủ 2 nhánh: rỗng -> báo hoàn thành; có dữ liệu -> map ra <li> */}
      {/* Vì sao ternary mà không phải 2x &&? Vì cả 2 nhánh đều có nội dung cần hiện. */}
      {pending.length === 0 ? (
        <li>Hoàn thành tất cả!</li>
      ) : (
        /* (7) .map() biến mảng dữ liệu -> mảng JSX; key={t.id} ổn định để React diff đúng. */
        /* Vì sao không key={index}? Vì thêm/xóa giữa list làm index dịch -> state nhảy sai chỗ. */
        pending.map((t) => <li key={t.id}>{t.text}</li>)
      )}
      {/* (8) Pattern && cho nhánh "có/không": chỉ hiện khi đúng, không có nhánh else */}
      {/* So sánh > 0 trả boolean — tránh in "0" khi dùng {pending.length && ...} */}
      {pending.length > 0 && <li>Bạn còn {pending.length} việc</li>}
    </ul>
  );
}
```

Các pattern điều kiện khác hay dùng (giữ từ bản cũ, bổ sung giải thích vì sao):

```tsx
// 1) Chỉ hiện khi đúng: vế trái PHẢI là boolean (không phải số/chuỗi thô)
{unread > 0 && <span>Bạn có {unread} tin nhắn</span>}
// Vì sao > 0? Vì unread = 0 mà viết {unread && ...} sẽ in "0".

// 2) Nhiều nhánh: object map sạch hơn switch lồng trong JSX
const label = { admin: "Quản trị", user: "Thành viên" }[role] ?? "Khách";
// Vì sao object mà không switch? Vì switch là statement, không nhét được vào {}.

// 3) Trả về null khi không muốn render gì — vẫn mount nhưng không có DOM
if (!visible) return null;
```

## Giải thích từng phần
- Dòng `type Todo = { id: number; text: string; done: boolean }`: định nghĩa shape item. Vì sao `id: number` quan trọng nhất? Vì `id` là key ổn định cho diff. Không có `id` là mất identity, phải sinh id.
- Dòng `const TODOS: Todo[] = [...]`: dữ liệu tĩnh ngoài component. Vì sao ngoài? Vì không đổi theo thời gian, để ngoài tránh tạo lại mỗi render. 1 done + 2 chưa done để `filter` có ý nghĩa demo.
- Dòng `export default function App({ isLogin = true }: { isLogin?: boolean })`: prop optional với default `true`. Vì sao default ở destructuring? Vì `defaultProps` đã bỏ ở function component. `isLogin?` với `?` nghĩa là cha có thể không truyền.
- Dòng `if (!isLogin) return <p>Vui lòng đăng nhập.</p>`: **early return**. Vì sao đặt đầu hàm? Để mọi code sau (filter/map) chỉ chạy khi đã login — phẳng, không lồng. Sạch hơn `isLogin ? <ul>...full list...</ul> : <p>...</p>` khi list dài.
- Dòng `const pending = TODOS.filter((t) => !t.done)`: xử lý dữ liệu trong body (JS), không phải trong JSX. Vì sao tách? Để đặt tên biến tốt (`pending`), dễ console.log debug, dễ test hàm lọc riêng. `filter` trả mảng mới, không sửa `TODOS`.
- Biểu thức `pending.length === 0 ? ... : ...`: ternary trong JSX. Vì sao ternary ở đây mà không `&&`? Vì hai nhánh đều có nội dung (empty state vs list). Gộp cả "rỗng" và "có" trong một biểu thức, không cần hai mảnh `&&` rời.
- Dòng `pending.map((t) => <li key={t.id}>{t.text}</li>)`: `map` trả mảng element. Vì sao `key={t.id}` mà không `key={t.text}`? Vì text có thể trùng ("Học JSX" xuất hiện 2 lần) còn id unique. Key trùng → React cảnh báo + diff sai.
- Dòng `{pending.length > 0 && <li>Bạn còn ...</li>}`: `&&` cho nhánh phụ "có/không". Vì sao `> 0` mà không `{pending.length && ...}`? Vì `length = 0` là số 0 render được → in "0" lạc lõng. So sánh trả boolean thì `false` bị bỏ qua đúng ý.
- Quy tắc `key` không phải prop: `<li key={t.id}>` — `key` do React tiêu thụ, `li` không đọc được. Muốn component con biết id, truyền thêm `id={t.id}`. Thử `props.key` trong con sẽ `undefined` — đó là thiết kế, không phải bug.
- Quy tắc không mutate khi sort: `[...arr].sort()` hoặc `toSorted()` (ES2023), không `.sort()` trực tiếp mảng state/props. Vì sao? Vì `.sort()` sửa mảng gốc tại chỗ — state/props bị sửa gián tiếp, React không phát hiện (cùng tham chiếu) → UI không cập nhật hoặc cập nhật sai.
- Quy tắc `return null` vs `return false`/`undefined`: cả ba đều không vẽ gì, nhưng `null` rõ nghĩa nhất ("cố ý không vẽ"). `undefined` dễ bị TS/lint cảnh báo, `false` dễ nhầm với logic `&&`.

## Bảng so sánh Angular ↔ React
| Angular | React | Ghi chú |
|---|---|---|
| `*ngIf="cond"` (cũ) / `@if (cond)` | `{cond && <X/>}` hoặc `cond ? <A/> : <B/>` | `@if` có `@else`; ternary tương đương nhánh else |
| `@if ... @else` | `cond ? <A/> : <B/>` | Không có block syntax, chỉ expression trong `{}` |
| `*ngFor="let t of todos"` / `@for (t of todos; track t.id)` | `todos.map(t => <li key={t.id}>...)` | Angular `track` ↔ React `key`; cùng ý identity |
| `@empty` block | ternary nhánh rỗng / kiểm `length === 0` | Không có cú pháp riêng, tự viết empty state |
| `*ngSwitch`/`@switch` | `switch` trong function hoặc object map | Object map gọn hơn khi chỉ map giá trị → text |
| `*ngIf="x as y"` | `const y = x; y ? render(y) : null` | Không có "as" binding, gán biến JS thường |
| `ng-template` + `ngTemplateOutlet` | render props (DAY 6) | Render linh hoạt theo function |
| Structural directive tùy biến | Hàm/component nhận điều kiện | React không có macro template, chỉ có hàm |
| `*ngIf` với async pipe | `use()` + Suspense (DAY 12) | Đọc promise trong render thay vì subscribe |
| `ngFor` lồng `ngIf` | `filter(...).map(...)` | Xử lý data trước khi render, không lồng directive |
| `$index` trong `@for` | tham số thứ 2 của `.map((item, index))` | Thứ tự giống nhau nhưng React không có `$even`/`$odd` sẵn, tự tính `index % 2` |

## Lỗi thường gặp (Common pitfalls)

### 1. `{count && <X/>}` khi `count = 0` hiện "0"
```tsx
// ❌ SAI: count = 0 -> vẽ số 0
const count = 0;
return <div>{count && <span>Có tin</span>}</div>;
```
```tsx
// ✅ ĐÚNG: ép boolean
return <div>{count > 0 && <span>Có {count} tin</span>}</div>;
```
Vì sao sai? Vì `0 && X` trả `0`, mà `0` render được. Chỉ `false`/`null`/`undefined` mới bị bỏ qua.

### 2. `key={index}` cho list có xóa/sắp xếp
```tsx
// ❌ SAI: xóa dòng đầu -> input dòng 2 nhảy lên dòng 1
{todos.map((t, i) => <li key={i}><input defaultValue={t.text} /></li>)}
```
```tsx
// ✅ ĐÚNG: key ổn định — xóa dòng nào, các dòng còn lại giữ đúng state
{todos.map((t) => <li key={t.id}><input defaultValue={t.text} /></li>)}
```
Vì sao sai? Vì index dịch khi xóa đầu, React tưởng "cùng vị trí = cùng item" và tái sử dụng node sai.

### 3. Key trùng nhau trong cùng list
```tsx
// ❌ SAI: 2 todo cùng text làm key -> trùng
{todos.map((t) => <li key={t.text}>{t.text}</li>)}
```
```tsx
// ✅ ĐÚNG: key theo id unique; không có id thì sinh khi nhận data
{todos.map((t) => <li key={t.id}>{t.text}</li>)}
// Hoặc: const withId = data.map((t) => ({ ...t, _key: crypto.randomUUID() }));
```
Vì sao sai? Vì React dùng key để phân biệt; trùng key thì diff gộp sai, cảnh báo console.

### 4. Lọc/sắp xếp ngay trong JSX
```tsx
// ❌ SAI: return dài, khó đặt tên, khó debug
return <ul>{todos.filter((t) => !t.done).sort((a, b) => a.id - b.id).map((t) => <li key={t.id}>{t.text}</li>)}</ul>;
```
```tsx
// ✅ ĐÚNG: tính ra biến đặt tên tốt, JSX chỉ vẽ
const pending = todos.filter((t) => !t.done);
const sorted = [...pending].sort((a, b) => a.id - b.id);
return <ul>{sorted.map((t) => <li key={t.id}>{t.text}</li>)}</ul>;
```

### 5. Dùng `switch` statement trong JSX
```tsx
// ❌ SAI: statement không nhét được vào {} — SyntaxError
return <div>{switch (role) { case "admin": return <A />; }}</div>;
```
```tsx
// ✅ ĐÚNG: object map hoặc tách hàm render
const label = { admin: "Quản trị", user: "Thành viên" }[role] ?? "Khách";
return <div>{label}</div>;
// Hoặc: function renderByRole(role: string) { switch (role) { ... } }
```

### 6. `&&` với chuỗi rỗng
```tsx
// ❌ SAI: name = "" -> in chuỗi rỗng (text node vô hình nhưng vẫn tồn tại, lệch flex)
{name && <span>{name}</span>}
```
```tsx
// ✅ ĐÚNG: so boolean rõ ràng
{name !== "" && <span>{name}</span>}
```

### 7. Quên `key`
Mô tả: warning "Each child in a list should have a unique key prop", diff dùng index ngầm → bug khi xóa/sắp xếp.
```tsx
// ❌ SAI
{todos.map((t) => <li>{t.text}</li>)}
```
```tsx
// ✅ ĐÚNG
{todos.map((t) => <li key={t.id}>{t.text}</li>)}
```

### 8. Mutate mảng bằng `.sort()`/`.reverse()` trong render
```tsx
// ❌ SAI: sửa mảng state gốc tại chỗ — cùng tham chiếu, React không phát hiện
const sorted = todos.sort((a, b) => a.id - b.id);
```
```tsx
// ✅ ĐÚNG: copy rồi sort, hoặc dùng bản không mutate ES2023
const sorted = [...todos].sort((a, b) => a.id - b.id);
// Hoặc: const sorted = todos.toSorted((a, b) => a.id - b.id);
```

## Best practices / Mẹo
- **Phân loại 3 cấp điều kiện:** `&&` (ẩn/hiện 1 món, vế trái boolean), `?:` (2 nhánh đều có nội dung), early `return` (chặn cả component). Vì sao phân loại? Để người đọc nhìn cú pháp là biết ý đồ, không phải đoán.
- Đưa **điều kiện phức tạp ra biến đặt tên tốt**: `const isOutOfQuota = pending.length > 5;` rồi `{isOutOfQuota && <Warn/>}`. Vì sao? Vì `pending.length > 5` trong JSX khó hiểu, biến tên tốt tự giải thích.
- Với danh sách lớn, `key` đúng là ưu tiên số 1, sau đó mới `memo` (DAY 10) + virtualization. Vì sao? Vì key sai thì memo/virtualize cũng sai theo.
- Dùng `key` để **reset component có state nội bộ** khi đối tượng đổi: `<Profile key={userId} userId={userId} />`. Vì sao? Vì đổi `userId` mà giữ state cũ (input đang gõ của user trước) là sai; key mới ép React unmount cũ + mount mới sạch.
- Dùng `toSorted`/`toReversed` (ES2023) để không mutate mảng gốc — an toàn cho state/props. Vì sao? Vì mutate state trực tiếp là nguồn bug khó tìm nhất React.
- Tránh đặt logic `filter+map` phức tạp trong JSX; tách thành `const rows = ...` ngay trên `return`. Vì sao? Để breakpoint, console.log, và unit test được.
- Nếu một list tái sử dụng nhiều nơi, tách component `TodoList` nhận `todos` + `onToggle` (kết hợp DAY 3 props). Vì sao? Để list có key/memo riêng, cha không re-render cả list khi chỉ đổi header.

## Bài tập nhỏ
1. Mở rộng `App`: thêm nút "Toggle trạng thái" cho từng todo (click → đảo `done`) giữ `key={t.id}` — quan sát UI đúng phần tử đổi. Đổi tạm sang `key={index}` và click liên tục để thấy lỗi state nhảy. Giải thích vì sao index sai.
2. Thay ternary `pending.length === 0` bằng 2 nhánh `{pending.length > 0 && ...}` + `<p>Chưa có việc nào.</p>` — so sánh độ đọc. Khi nào ternary rõ hơn 2x `&&`?
3. Thêm nhánh hiển thị theo `role`: `admin` → "Quản trị", `user` → "Thành viên" bằng object map thay `switch`. Vì sao object map nhét được vào JSX mà switch không?
4. Thêm bộ lọc `all | active | done` truyền prop `filter` và lọc trước khi `.map`. Đảm bảo `filter` xong mới `map`, không lồng trong JSX.
5. Thêm "empty state" riêng cho từng filter (vd filter `done` rỗng → "Chưa hoàn thành việc nào"). Vì sao empty state tốt hơn `<ul>` trống?

## Reference
- https://react.dev/learn/conditional-rendering
- https://react.dev/learn/rendering-lists
- https://react.dev/learn/understanding-reconciliation
- https://react.dev/learn/preserving-and-resetting-state
