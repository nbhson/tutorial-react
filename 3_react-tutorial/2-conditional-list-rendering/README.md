# DAY 2: RENDER CÓ ĐIỀU KIỆN & DANH SÁCH

## Mục tiêu bài học
- Xóa hẳn khái niệm directive: React không có `*ngIf`/`*ngFor`/`@if`/`@for` — mọi rẽ nhánh và lặp đều là JS thuần trong JSX.
- Thành thạo 3 kỹ thuật điều kiện: early `return`, `&&`, `?:` — biết chọn đúng cho từng tình huống.
- Hiểu vì sao `key` bắt buộc trong list, và vì sao không dùng `key={index}` khi list thay đổi.

## Khái niệm cốt lõi (Core)

Mục này nói về cách React "vẽ có điều kiện và vẽ danh sách" mà không cần directive — đọc để hiểu vì sao JSX cho phép dùng thẳng JS, và `key` quan trọng thế nào.

### 1. JSX chỉ là expression — không cần cú pháp mới cho rẽ nhánh
Angular cần directive (`*ngIf`, `@if`) vì template không phải JS — template là DSL phải học thêm. React không cần vì JSX là JS: bạn dùng đúng cú pháp rẽ nhánh của JS trên *giá trị JSX*. Ví von: JSX là một "món đồ" bình thường trong JS — muốn rẽ nhánh thì rẽ nhánh như mọi món đồ khác, chẳng cần học "ngôn ngữ chỉ dẫn" riêng như Angular.

> 📄 **Code ví dụ:** [`examples/01-1-jsx-chi-la-expression-khong-can-cu.tsx`](examples/01-1-jsx-chi-la-expression-khong-can-cu.tsx)

Vì sao? Vì `<div>Hi</div>` sau biên dịch chỉ là object. Rẽ nhánh object thì `if`/`?:`/`&&` của JS là đủ. Nếu bạn cố tìm `*ngIf` trong React, bạn đang mang tư duy template sang nơi không cần. Hệ quả thực tế: logic lọc/sắp xếp/rẽ nhánh nằm ở phần JS trên đầu component, phần `return` chỉ còn "vẽ" — code đọc như "chuẩn bị dữ liệu rồi in".

> **Tóm gọn 1 câu:** JSX chỉ là giá trị JS — rẽ nhánh bằng `if`/`&&`/`?:` thuần, không cần directive.

### 2. `&&` cho nhánh "có/không"
`{cond && <span/>}` nghĩa là "nếu cond đúng thì vẽ, sai thì không vẽ gì". Về bản chất là toán tử `&&` của JS: trả vế phải khi vế trái truthy, trả vế trái khi falsy.

> 📄 **Code ví dụ:** [`examples/02-2-cho-nhanh-co-khong.tsx`](examples/02-2-cho-nhanh-co-khong.tsx)

Cạm bẫy nổi tiếng: nếu vế trái là số `0` hoặc chuỗi rỗng, `&&` trả về chính nó và React in ra "0"/"". Vì sao? Vì `0` và `""` là giá trị render được (khác `false`/`null`/`undefined` bị bỏ qua).

> 📄 **Code ví dụ:** [`examples/03-2-cho-nhanh-co-khong.tsx`](examples/03-2-cho-nhanh-co-khong.tsx)

Quy tắc: vế trái của `&&` luôn phải là boolean (`> 0`, `!== ""`, `!!value`), không để số/chuỗi thô. Ví von: vế trái của `&&` phải "trả lời đúng/sai" như cánh cửa có khóa — nếu để con số làm khóa là React in luôn con số đó lên cửa, cười ra nước mắt.

> **Tóm gọn 1 câu:** `&&` chỉ an toàn khi vế trái là boolean — để số 0 hay chuỗi rỗng là React in chúng lên màn hình.

### 3. `?:` cho 2 nhánh đều có nội dung
Ternary luôn trả về một trong hai giá trị — dùng khi cả 2 nhánh đều cần vẽ (rỗng/có dữ liệu, login/guest, admin/user). Ví von: ternary như ngã tư hai hướng — đi trái hoặc đi phải, luôn chọn được một đường; `&&` chỉ là đường cụt — đúng thì đi, sai thì quay đầu.

> 📄 **Code ví dụ:** [`examples/04-3-cho-2-nhanh-eu-co-noi-dung.tsx`](examples/04-3-cho-2-nhanh-eu-co-noi-dung.tsx)

Vì sao không dùng 2x `&&` (`{empty && A}{!empty && B}`)? Vì ternary thể hiện "hai nhánh loại trừ nhau" rõ hơn, chỉ đánh giá một nhánh, và TypeScript hiểu kiểu union gọn. Khi có 3+ nhánh, đừng lồng ternary 3 tầng — dùng object map hoặc tách hàm (xem dưới).

> 📄 **Code ví dụ:** [`examples/05-3-cho-2-nhanh-eu-co-noi-dung.tsx`](examples/05-3-cho-2-nhanh-eu-co-noi-dung.tsx)

> **Tóm gọn 1 câu:** Hai nhánh đều cần vẽ thì dùng ternary — nó nói rõ "hai đường loại trừ nhau" mà `&&` không nói được.

### 4. Early return khi rẽ cả component
Đặt logic lọc/điều kiện đầu function, `return` sớm. Phần sau không phải lồng sâu một tầng `if`. Ví von: như bảo vệ ở cửa — chưa đủ điều kiện thì mời ra ngay khỏi vào trong; còn ternary lồng là dẫn khách vào hết các phòng rồi mới hỏi "bạn được vào đây không?".

> 📄 **Code ví dụ:** [`examples/06-4-early-return-khi-re-ca-component.tsx`](examples/06-4-early-return-khi-re-ca-component.tsx)

Vì sao early return thắng ternary lồng? Vì ternary lồng 3 tầng (`a ? b ? c : d : e`) khó đọc, khó đặt breakpoint, khó test từng nhánh. Early return mỗi nhánh một `return`, dễ thêm log, dễ tách hàm. Một dạng nữa là `if (!visible) return null` — "không vẽ gì nhưng vẫn mount" (component tồn tại, chỉ không có DOM).

> **Tóm gọn 1 câu:** Điều kiện chặn cả component thì early return lên đầu — phẳng, dễ đọc, dễ test từng nhánh.

### 5. `key` là identity cho reconciliation
Mục này về phần quan trọng nhất của danh sách: React nhận diện từng item bằng gì giữa các lần render, và vì sao key sai là state nhảy lung tung.

React dùng key để biết element nào giữ nguyên, nào thêm/xóa/di chuyển giữa các lần render. Key tốt = id ổn định từ dữ liệu (`t.id`). Key xấu = `index` khi list thêm/xóa/sắp xếp giữa → sai state, sai vị trí, sai animation. Ví von: key như thẻ căn cước của từng item — React đối chiếu căn cước chứ không đối chiếu "ngồi ghế số mấy"; ai đổi chỗ ngồi mà còn đúng thẻ thì vẫn là người cũ.

> 📄 **Code ví dụ:** [`examples/07-5-key-la-identity-cho-reconciliation.tsx`](examples/07-5-key-la-identity-cho-reconciliation.tsx)

Cơ chế: mỗi render React so cây cũ/mới theo vị trí + key. Cùng key → giữ node DOM + state nội bộ (input đang gõ, animation đang chạy), chỉ cập nhật text đổi. Key mới → tạo node. Key mất → unmount + cleanup. Key đổi vị trí → di chuyển node thay vì tạo lại. Nếu key là index và bạn xóa phần tử đầu, mọi index dịch 1 — React tưởng mọi item đều "đổi nội dung" và tái sử dụng sai node. Nếu dữ liệu không có id, sinh id ổn định khi nhận dữ liệu (`crypto.randomUUID()`), không dùng index.

Chi tiết hay quên: **`key` không phải prop** — React tiêu thụ nó cho diff, component con không đọc được `props.key`. Muốn con biết id, truyền thêm prop `id={t.id}` riêng.

> **Tóm gọn 1 câu:** `key` là căn cước của item trong mắt React — dùng id ổn định từ dữ liệu, đừng bao giờ dùng index khi list có xóa/sắp xếp.

### 6. `.map()` biến mảng dữ liệu thành mảng JSX
JSX render mảng trực tiếp được: `pending.map(...)` trả mảng `<li>`, React nối vào cây theo thứ tự, dùng `key` để nhận diện.

> 📄 **Code ví dụ:** [`examples/08-6-map-bien-mang-du-lieu-thanh-mang.tsx`](examples/08-6-map-bien-mang-du-lieu-thanh-mang.tsx)

Vì sao lọc/sắp xếp trước JSX mà không làm ngay trong `return`? Vì `return` lẫn 3 tầng `filter().sort().map()` khó đọc, khó đặt tên biến trung gian (`pending`, `sorted`), khó test. Quy tắc: biến `const rows = ...` ngay trên `return`, JSX chỉ còn `{rows}`.

> **Tóm gọn 1 câu:** `.map()` biến dữ liệu thành JSX, nhưng lọc/sắp xếp hãy làm ở body component — `return` chỉ nên "in kết quả".

### 7. Falsy không phải lúc nào cũng "không render"
`null`/`false`/`undefined` bị bỏ qua (không vẽ gì). Nhưng `0`, `""`, `NaN` là giá trị render được — React in chúng ra DOM.

> 📄 **Code ví dụ:** [`examples/09-7-falsy-khong-phai-luc-nao-cung-khong.tsx`](examples/09-7-falsy-khong-phai-luc-nao-cung-khong.tsx)

Vì sao cần nhớ? Vì pattern `{list.length && <List/>}` sẽ in "0" khi rỗng. Fix luôn là so boolean (`length > 0`). Với chuỗi, `{name && <X/>}` khi `name = ""` in chuỗi rỗng — thường vô hình nhưng vẫn tạo text node. Muốn chắc chắn, `{name !== "" && <X/>}` hoặc `{Boolean(name) && <X/>}`.

> **Tóm gọn 1 câu:** Trong JSX, chỉ `null`/`false`/`undefined` là "vô hình" — số 0, chuỗi rỗng, NaN đều được in ra, nên hãy so boolean trước khi `&&`.

### Keyword chính
`conditional rendering`, `&&`, `ternary`, `early return`, `key`, `.map()`, `reconciliation`, `track` (Angular) ↔ `key` (React). Thêm `empty state`, `identity`, `immutable sort` khi đọc code thật.

> **Tóm gọn 1 câu:** 7 từ khóa này là toàn bộ "ngữ pháp vẽ có điều kiện" của React — thuộc trước, đọc code sau.

## Luồng hoạt động (Flow)
Mục này theo một lượt render của App từ prop `isLogin` tới khi DOM commit — đọc để thấy thứ tự: chặn → lọc → rẽ nhánh → map → diff.
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

> **Tóm gọn 1 câu:** Một lượt render là một chuỗi: chặn (early return) → chuẩn bị data (filter/sort) → rẽ nhánh → `.map()` với key → React diff và chỉ chạm đúng chỗ khác.

## Ví dụ chi tiết
Mục này cho code hoàn chỉnh khớp `example.tsx` — copy chạy thử rồi quay lại phần giải thích.
Code dưới đây khớp 1-1 với `example.tsx` cùng thư mục:

> 📄 **Code ví dụ:** [`examples/10-vi-du-chi-tiet.tsx`](examples/10-vi-du-chi-tiet.tsx)

Các pattern điều kiện khác hay dùng (giữ từ bản cũ, bổ sung giải thích vì sao):

> 📄 **Code ví dụ:** [`examples/11-vi-du-chi-tiet.tsx`](examples/11-vi-du-chi-tiet.tsx)

## Giải thích từng phần
Mục này soi từng dòng của example — đọc khi bạn thắc mắc "vì sao `key={t.id}` mà không phải `key={t.text}`".
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
Mục này là "từ điển directive" — mỗi cú pháp template của Angular đổi thành cấu trúc JS nào trong JSX.

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

> **Cách đọc bảng này:** mỗi dòng là một directive Angular đối chiếu sang cách viết JS thuần trong JSX, cột Ghi chú nêu khác biệt tinh tế — tra theo directive bạn đang tìm thay thế, đừng học thuộc cả bảng.

## Lỗi thường gặp (Common pitfalls)
Mục này là "bản đồ bẫy" của render có điều kiện — số 0 lạc lõng, state nhảy dòng vì key sai; đọc trước để nhận diện nhanh khi UI "hành xử kỳ lạ".

### 1. `{count && <X/>}` khi `count = 0` hiện "0"
> 📄 **Code ví dụ:** [`examples/12-1-count-x-khi-count-0-hien-0.tsx`](examples/12-1-count-x-khi-count-0-hien-0.tsx)
> 📄 **Code ví dụ:** [`examples/13-1-count-x-khi-count-0-hien-0.tsx`](examples/13-1-count-x-khi-count-0-hien-0.tsx)
Vì sao sai? Vì `0 && X` trả `0`, mà `0` render được. Chỉ `false`/`null`/`undefined` mới bị bỏ qua.

### 2. `key={index}` cho list có xóa/sắp xếp
> 📄 **Code ví dụ:** [`examples/14-2-key-index-cho-list-co-xoa-sap.tsx`](examples/14-2-key-index-cho-list-co-xoa-sap.tsx)
> 📄 **Code ví dụ:** [`examples/15-2-key-index-cho-list-co-xoa-sap.tsx`](examples/15-2-key-index-cho-list-co-xoa-sap.tsx)
Vì sao sai? Vì index dịch khi xóa đầu, React tưởng "cùng vị trí = cùng item" và tái sử dụng node sai.

### 3. Key trùng nhau trong cùng list
> 📄 **Code ví dụ:** [`examples/16-3-key-trung-nhau-trong-cung-list.tsx`](examples/16-3-key-trung-nhau-trong-cung-list.tsx)
> 📄 **Code ví dụ:** [`examples/17-3-key-trung-nhau-trong-cung-list.tsx`](examples/17-3-key-trung-nhau-trong-cung-list.tsx)
Vì sao sai? Vì React dùng key để phân biệt; trùng key thì diff gộp sai, cảnh báo console.

### 4. Lọc/sắp xếp ngay trong JSX
> 📄 **Code ví dụ:** [`examples/18-4-loc-sap-xep-ngay-trong-jsx.tsx`](examples/18-4-loc-sap-xep-ngay-trong-jsx.tsx)
> 📄 **Code ví dụ:** [`examples/19-4-loc-sap-xep-ngay-trong-jsx.tsx`](examples/19-4-loc-sap-xep-ngay-trong-jsx.tsx)

### 5. Dùng `switch` statement trong JSX
> 📄 **Code ví dụ:** [`examples/20-5-dung-switch-statement-trong-jsx.tsx`](examples/20-5-dung-switch-statement-trong-jsx.tsx)
> 📄 **Code ví dụ:** [`examples/21-5-dung-switch-statement-trong-jsx.tsx`](examples/21-5-dung-switch-statement-trong-jsx.tsx)

### 6. `&&` với chuỗi rỗng
> 📄 **Code ví dụ:** [`examples/22-6-voi-chuoi-rong.tsx`](examples/22-6-voi-chuoi-rong.tsx)
> 📄 **Code ví dụ:** [`examples/23-6-voi-chuoi-rong.tsx`](examples/23-6-voi-chuoi-rong.tsx)

### 7. Quên `key`
Mô tả: warning "Each child in a list should have a unique key prop", diff dùng index ngầm → bug khi xóa/sắp xếp.
> 📄 **Code ví dụ:** [`examples/24-7-quen-key.tsx`](examples/24-7-quen-key.tsx)
> 📄 **Code ví dụ:** [`examples/25-7-quen-key.tsx`](examples/25-7-quen-key.tsx)

### 8. Mutate mảng bằng `.sort()`/`.reverse()` trong render
> 📄 **Code ví dụ:** [`examples/26-8-mutate-mang-bang-sort-reverse-trong-render.tsx`](examples/26-8-mutate-mang-bang-sort-reverse-trong-render.tsx)
> 📄 **Code ví dụ:** [`examples/27-8-mutate-mang-bang-sort-reverse-trong-render.tsx`](examples/27-8-mutate-mang-bang-sort-reverse-trong-render.tsx)

## Best practices / Mẹo
Mục này là "nghề chọn cú pháp" — 3 cấp điều kiện, biến đặt tên tốt, key đúng — đọc để JSX của bạn tự đọc như văn xuôi.
- **Phân loại 3 cấp điều kiện:** `&&` (ẩn/hiện 1 món, vế trái boolean), `?:` (2 nhánh đều có nội dung), early `return` (chặn cả component). Vì sao phân loại? Để người đọc nhìn cú pháp là biết ý đồ, không phải đoán.
- Đưa **điều kiện phức tạp ra biến đặt tên tốt**: `const isOutOfQuota = pending.length > 5;` rồi `{isOutOfQuota && <Warn/>}`. Vì sao? Vì `pending.length > 5` trong JSX khó hiểu, biến tên tốt tự giải thích.
- Với danh sách lớn, `key` đúng là ưu tiên số 1, sau đó mới `memo` (DAY 10) + virtualization. Vì sao? Vì key sai thì memo/virtualize cũng sai theo.
- Dùng `key` để **reset component có state nội bộ** khi đối tượng đổi: `<Profile key={userId} userId={userId} />`. Vì sao? Vì đổi `userId` mà giữ state cũ (input đang gõ của user trước) là sai; key mới ép React unmount cũ + mount mới sạch.
- Dùng `toSorted`/`toReversed` (ES2023) để không mutate mảng gốc — an toàn cho state/props. Vì sao? Vì mutate state trực tiếp là nguồn bug khó tìm nhất React.
- Tránh đặt logic `filter+map` phức tạp trong JSX; tách thành `const rows = ...` ngay trên `return`. Vì sao? Để breakpoint, console.log, và unit test được.
- Nếu một list tái sử dụng nhiều nơi, tách component `TodoList` nhận `todos` + `onToggle` (kết hợp DAY 3 props). Vì sao? Để list có key/memo riêng, cha không re-render cả list khi chỉ đổi header.

## Bài tập nhỏ
Làm tay để nhớ — mỗi bài là một thí nghiệm phá key hoặc so sánh cú pháp để thấy khác biệt bằng mắt.

1. Mở rộng `App`: thêm nút "Toggle trạng thái" cho từng todo (click → đảo `done`) giữ `key={t.id}` — quan sát UI đúng phần tử đổi. Đổi tạm sang `key={index}` và click liên tục để thấy lỗi state nhảy. Giải thích vì sao index sai.
2. Thay ternary `pending.length === 0` bằng 2 nhánh `{pending.length > 0 && ...}` + `<p>Chưa có việc nào.</p>` — so sánh độ đọc. Khi nào ternary rõ hơn 2x `&&`?
3. Thêm nhánh hiển thị theo `role`: `admin` → "Quản trị", `user` → "Thành viên" bằng object map thay `switch`. Vì sao object map nhét được vào JSX mà switch không?
4. Thêm bộ lọc `all | active | done` truyền prop `filter` và lọc trước khi `.map`. Đảm bảo `filter` xong mới `map`, không lồng trong JSX.
5. Thêm "empty state" riêng cho từng filter (vd filter `done` rỗng → "Chưa hoàn thành việc nào"). Vì sao empty state tốt hơn `<ul>` trống?

> **Tóm gọn 1 câu:** Toàn bài gói trong 1 nhịp: `&&` cho có/không, ternary cho 2 nhánh, early return cho chặn cả trang, `.map()` + id làm key cho danh sách.

## Reference
- https://react.dev/learn/conditional-rendering
- https://react.dev/learn/rendering-lists
- https://react.dev/learn/understanding-reconciliation
- https://react.dev/learn/preserving-and-resetting-state
