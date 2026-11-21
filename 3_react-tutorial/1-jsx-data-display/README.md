# DAY 1: JSX & HIỂN THỊ DỮ LIỆU

Ngày đầu tiên "nói chuyện" với React: JSX là gì, đưa dữ liệu vào màn hình bằng đường nào, và nhận sự kiện người dùng thế nào. Bài này đối chiếu luôn với Angular (`{{ }}`, `[src]`, `[(ngModel)]`) để bạn thấy bản đồ 1:1 giữa hai framework.

## Mục tiêu bài học

Mục này nêu 3 đích của DAY 1. Đọc để biết cuối bài bạn làm được gì.

- Nắm JSX là cú pháp mở rộng của TS cho phép viết HTML trong logic render, và `{expression}` là cửa ngõ duy nhất đưa dữ liệu TS vào JSX.
- Hiểu 4 chiều bind data: interpolation `{}`, attribute binding, event binding (`on*`), và two-way binding qua controlled input.
- Đối chiếu trực tiếp với Angular: `{{ }}`, `[src]`, `(click)`, `[(ngModel)]` đều có bản đồ 1:1 trong React.

> **Tóm gọn 1 câu:** Cuối DAY 1 bạn biết cả 4 "đường dây" nối TS với JSX: interpolation, attribute, event, và controlled input — cùng bản đồ dịch từ Angular.

## Khái niệm cốt lõi (Core)

Mục này định nghĩa 7 khái niệm nền của JSX và hiển thị dữ liệu. Đọc tuần tự — mỗi khái niệm dựng trên cái trước.

### 1. JSX không phải HTML, cũng không phải template string
Vite (qua esbuild/Babel) biên dịch JSX thành lời gọi `jsx(type, props)`. Về bản chất JSX chỉ là **function call trả về object mô tả UI** (React element), không phải chuỗi HTML, không phải DOM thật.

> 📄 **Code ví dụ:** [`examples/01-1-jsx-khong-phai-html-cung-khong-phai.tsx`](examples/01-1-jsx-khong-phai-html-cung-khong-phai.tsx)

Vì sao quan trọng? Vì JSX là JS nên bạn được dùng toàn bộ sức mạnh JS: biến, hàm, toán tử, import. Angular template là DSL riêng (cần học `*ngIf`, `| pipe`), còn JSX không có cú pháp mới — biết JS là biết JSX. Hệ quả: mọi logic `if`/`for`/`format` nằm ở phần JS trên đầu component, phần `return` chỉ còn "vẽ". Nếu bạn nhét `if` statement vào trong `{}` sẽ lỗi, vì `{}` chỉ nhận *expression* (giá trị), không nhận *statement* (câu lệnh). Ví von: JSX là **bản vẽ mô hình nhỏ** chứ không phải ngôi nhà — vẽ sai vật liệu thì compiler chặn ngay lúc duyệt bản vẽ, không đợi đến lúc xây.

### 2. Một chiều dữ liệu rõ ràng
Dữ liệu đi từ TS → JSX qua `{}` (interpolation/attribute). Sự kiện đi từ JSX → TS qua props `on*` (`onClick`, `onChange`). Không có auto two-way như `[(ngModel)]` — hai chiều được mô hình hóa thành "cha cho giá trị + con báo sự kiện".

> 📄 **Code ví dụ:** [`examples/02-2-mot-chieu-du-lieu-ro-rang.tsx`](examples/02-2-mot-chieu-du-lieu-ro-rang.tsx)

Vì sao một chiều tốt? Vì luồng dữ liệu luôn truy vết được: muốn biết `<p>` hiện gì, chỉ cần nhìn `name`. Không có trạng thái "DOM và state lệch nhau". Nếu bạn bỏ `onChange` mà giữ `value`, input "đóng băng" (gõ không vào) — đó không phải bug React, đó là hệ quả đúng của một chiều: UI chỉ phản ánh state, state không đổi thì UI đứng im. Hãy hình dung một chiều như **máy chiếu trình chiếu slide**: máy chiếu (UI) chỉ hiện đúng trang slide (state) — muốn đổi hình thì đổi slide, chứ gõ lên màn chiếu không được.

### 3. Interpolation `{}` chứa mọi JS expression
Biến, phép toán, gọi hàm, ternary, template string — mọi thứ trả về giá trị đều dùng được. Chỉ cần nhớ: *expression* được, *statement* (`if`, `for`, `switch`) không được.

> 📄 **Code ví dụ:** [`examples/03-3-interpolation-chua-moi-js-expression.tsx`](examples/03-3-interpolation-chua-moi-js-expression.tsx)

> 📄 **Code ví dụ:** [`examples/04-3-interpolation-chua-moi-js-expression.tsx`](examples/04-3-interpolation-chua-moi-js-expression.tsx)

Nếu render object trực tiếp (`{user}`), React ném "Objects are not valid as a React child". Vì sao? Vì object không có cách hiển thị mặc định. Fix: chọn field cụ thể (`{user.name}`). `true`/`false`/`null`/`undefined` bị bỏ qua khi render — đó là nền tảng của pattern `{cond && <X/>}` ở DAY 2.

### 4. Controlled input = single source of truth
`<input value={state} onChange={e => setState(...)} />`: `value` lấy từ state, `onChange` ghi ngược lại state. DOM và state luôn khớp. Đây là cách React thay thế hoàn toàn `[(ngModel)]`.

> 📄 **Code ví dụ:** [`examples/05-4-controlled-input-single-source-of-truth.tsx`](examples/05-4-controlled-input-single-source-of-truth.tsx)

Cơ chế chi tiết: mỗi phím gõ fire `onChange` với `e.target.value` là text hiện tại trong ô. `setName` báo React state đổi → React re-render component → JSX đánh giá lại `value={name}` với giá trị mới → DOM cập nhật. React còn gộp (batch) nhiều `setState` trong cùng event thành một lần re-render để tối ưu. Nếu bạn bỏ `value`, input thành uncontrolled — DOM tự giữ, state không biết, hai nguồn sự thật lệch nhau. Controlled input giống **quầy thu ngân giữ sổ chính**: mọi tiền khách đưa phải ghi vào sổ (state), màn hình chỉ đọc từ sổ — không có "két riêng" nào lệch số được.

### 5. Uncontrolled input (ít dùng)
Chỉ dùng `defaultValue`/`ref`, DOM tự giữ giá trị, React không kiểm soát mỗi phím. Hữu ích cho form lớn cần hiệu năng (không re-render mỗi phím) hoặc tích hợp thư viện DOM thuần.

> 📄 **Code ví dụ:** [`examples/06-5-uncontrolled-input-it-dung.tsx`](examples/06-5-uncontrolled-input-it-dung.tsx)

Vì sao controlled vẫn được khuyên? Vì uncontrolled khó validate live, khó disable nút theo input, khó reset. Chỉ dùng uncontrolled khi form hàng chục field và đo được controlled gây lag (chi tiết DAY 11 với react-hook-form dùng uncontrolled + ref để giảm re-render).

### 6. `{}` không render được object/boolean trực tiếp
`{someObject}` lỗi; `true`/`false`/`null`/`undefined` bị bỏ qua (không vẽ gì). Đây không phải thiếu sót mà là thiết kế để pattern điều kiện gọn.

> 📄 **Code ví dụ:** [`examples/07-6-khong-render-uoc-object-boolean-truc-tiep.tsx`](examples/07-6-khong-render-uoc-object-boolean-truc-tiep.tsx)

Cạm bẫy nổi tiếng: `{count && <X/>}` khi `count = 0` sẽ in ra "0" vì `0` là giá trị render được (khác `false`). Fix: `{count > 0 && <X/>}` để vế trái luôn boolean.

### 7. Event handler nhận SyntheticEvent
React bọc event trình duyệt thành `SyntheticEvent` thống nhất: có `preventDefault`/`stopPropagation`, hoạt động giống nhau mọi browser. Bạn không cần lo `window.event` hay prefix hãng.

> 📄 **Code ví dụ:** [`examples/08-7-event-handler-nhan-syntheticevent.tsx`](examples/08-7-event-handler-nhan-syntheticevent.tsx)

Vì sao `onClick={() => alert(...)}` mà không phải `onClick={alert(...)}`? Vì JSX cần *tham chiếu hàm* để gọi sau khi click. `alert(...)` gọi ngay lúc render (truyền kết quả `undefined` vào onClick). Bọc arrow `() => alert(...)` tạo hàm mới, click mới chạy.

### Keyword chính
`JSX`, `{expression}`, `interpolation`, `onClick`, `onChange`, `controlled input`, `event`, `fragment`. Thêm `className`, `style object`, `SyntheticEvent` khi đọc code thật.

> **Tóm gọn 1 câu:** Bảy khái niệm chốt một triết lý: JSX là code (không phải template), dữ liệu một chiều từ state ra UI, và state là nguồn sự thật duy nhất.

## Luồng hoạt động (Flow)

Mục này đi qua 12 bước vòng đời của demo: từ lần render đầu, gõ input, đến bấm nút. Đọc để thấy mọi khái niệm trên "chạy" thế nào trong một component thật.
1. Component `App` chạy render lần đầu: tạo object `user` (`name`, `age`), đọc `name` khởi tạo state, đọc `isActive = true`.
2. JSX được đánh giá: `{name}` → "Son Nguyen"; `{user.age + 1}` → 31; `alt={name}` → alt text; `className={isActive ? "active" : ""}` → "active". Kết quả là một cây object (React element tree), chưa phải DOM.
3. React chuyển element tree thành DOM thật (`<h3>`, `<p>`, `<img>`, `<input>`, `<button>`), hiển thị nội dung.
4. Người dùng gõ vào `<input>` → sự kiện `onChange` fire với `e.target.value` mới → `setName(...)` được gọi.
5. `setName` báo React state thay đổi → React **lên lịch re-render** component (không vẽ ngay đồng bộ mà batch).
6. Re-render tạo element tree mới; React so sánh với cây cũ (reconciliation/diffing) và chỉ cập nhật node khác biệt vào DOM (ví dụ text trong `<h3>`, `value` của input, `alt` của ảnh).
7. `{name}` cập nhật text; `value` của input khớp state. Bấm "Đảo trạng thái" → `setIsActive` → `className`/`style`/`text` đổi theo boolean.
8. Bấm "Click me!" → `onClick` fire → `alert` chạy với `name` mới nhất từ closure của render hiện tại (vì mỗi render tạo một closure mới giữ `name` lúc đó).
9. Nếu bạn bỏ `onChange` mà giữ `value`, gõ không thay đổi state → input "đứng im" (controlled "frozen"). Đây là minh chứng sống cho một chiều.
10. Nếu bạn bỏ `value`, input thành uncontrolled — DOM tự do, state không biết, `<h3>` không cập nhật khi gõ.
11. React gộp các `setState` trong cùng một event thành một lần re-render (batching) để tối ưu hiệu năng — gõ nhanh 5 phím không phải 5 lần vẽ full cây.
12. Sau khi commit DOM, React chạy effect (nếu có) — nhưng ở DAY 1 chưa cần effect, chỉ cần state. Effect dành cho hệ thống ngoài (timer/DOM/socket), không phải để tính `{user.age + 1}`.

> **Tóm gọn 1 câu:** 12 bước kể trọn vòng đời: vẽ lần đầu → gõ phím → setName → re-render → diff → vá đúng chỗ — và mọi biến chứng đều là hệ quả của một chiều.

## Ví dụ chi tiết

Mục này trỏ tới 2 file code khớp 1-1 với `example.tsx` cùng thư mục. Đọc kèm để thấy lý thuyết thành code chạy được.

Code dưới đây khớp 1-1 với `example.tsx` cùng thư mục:

> 📄 **Code ví dụ:** [`examples/09-vi-du-chi-tiet.tsx`](examples/09-vi-du-chi-tiet.tsx)

Các biến thể binding hay dùng (đã có một phần trong `example.tsx`, liệt kê đầy đủ để tra cứu):

> 📄 **Code ví dụ:** [`examples/10-vi-du-chi-tiet.tsx`](examples/10-vi-du-chi-tiet.tsx)

> **Tóm gọn 1 câu:** Hai file ví dụ: bản demo chính khớp `example.tsx`, và bảng biến thể binding đầy đủ để tra cứu nhanh.

## Giải thích từng phần

Mục này bóc từng dòng code trong `example.tsx` kèm "vì sao". Đọc khi muốn hiểu sâu từng quyết định viết code thay vì chỉ copy.
- Dòng `import { useState } from "react"`: lấy hook giữ state. Vì sao cần? Vì biến thường mất sau mỗi render, state do React giữ qua các lần render và `setName` là cách duy nhất báo React "dữ liệu đổi, vẽ lại đi".
- Dòng `type User = { name: string; age: number }`: định nghĩa shape dữ liệu. Vì sao type ở đây? Để `user.age` được IDE gợi ý, gõ sai `user.agge` TS báo ngay lúc compile thay vì trắng trang lúc chạy.
- Dòng `const user: User = { name: "Son Nguyen", age: 30 }`: object tĩnh tạo mỗi render. Vì sao không `useState` cho `user`? Vì `user` không đổi theo thời gian trong demo — dùng biến thường là đủ, chỉ `name` (người dùng sửa) mới cần state. Đây là bài học "đừng state hóa mọi thứ".
- Dòng `const [name, setName] = useState(user.name)`: khởi tạo state bằng `"Son Nguyen"`. `useState` trả tuple `[giá trị hiện tại, hàm cập nhật]`. Giá trị khởi tạo chỉ dùng lần mount đầu; render sau bỏ qua.
- Dòng `const [isActive, setIsActive] = useState(true)`: state boolean điều khiển class/style. Vì sao tách state riêng mà không gộp vào object? Vì mỗi state đổi chỉ re-render một lần, tách nhỏ dễ suy luận, gộp object lớn dễ quên spread gây mất field.
- Cặp `<>...</>`: fragment — nhóm 7 element con mà không thêm node DOM. Vì sao không `<div>`? Vì `<div>` thừa phá layout flex/grid và làm DOM sâu. Fragment tương đương `ng-container`.
- Dòng `<h3>Your name: {name}</h3>`: interpolation. Mỗi lần `name` đổi, React diff thấy text node này khác → chỉ cập nhật đúng text node, không dựng lại `<h3>`.
- Dòng `<p>Next year: {user.age + 1}</p>`: chứng minh `{}` là **biểu thức bất kỳ**. `user.age + 1` tính mỗi render (derived value) — rẻ, không cần `useState` hay `useMemo`.
- Dòng `<img src="..." alt={name} width={120} />`: attribute binding. `src` là string tĩnh nên không cần `{}`; `alt={name}` động nên cần. `width={120}` là number — JSX truyền number trực tiếp, không cần `"120"`.
- Dòng `<div className={...} style={{...}}>`: `className` thay vì `class` vì `class` là keyword JS và React dùng DOM property name. `style` là object camelCase (`backgroundColor`), không phải chuỗi CSS (`background-color`). Viết `style="color:red"` sẽ lỗi type.
- Dòng `<button onClick={() => setIsActive((a) => !a)}>`: functional update `(a) => !a` đảm bảo đảo từ giá trị mới nhất, an toàn khi click nhanh nhiều lần (tránh stale closure khi dùng `!isActive` trực tiếp).
- Dòng `<input value={name} onChange={...} />`: controlled input. `e` suy kiểu `ChangeEvent<HTMLInputElement>`, `e.target.value` là string. Không có `[(ngModel)]` — giá trị hiển thị do state quyết định.
- Dòng `<button onClick={() => alert(...)}}`: arrow bọc để truyền tham chiếu. Khác `onClick={alert(...)}` (gọi ngay lúc render, truyền `undefined` vào onClick). Quy tắc: cần tham số → bọc arrow; không tham số → truyền tên hàm.
- Quy tắc `{}` không render object: phải chọn field (`{user.name}`), không `{user}`. Boolean/null bị bỏ qua nên `{isActive && <span/>}` là pattern chuẩn sang DAY 2.

> **Tóm gọn 1 câu:** Mỗi dòng code đều có "vì sao" riêng — từ state tách nhỏ, fragment thay div, đến arrow bọc handler: đọc mục này như bản chú thích của ví dụ.

## Bảng so sánh Angular ↔ React

Mục này là từ điển dịch Angular → React cho các kiểu binding phổ biến. Đọc khi quen Angular và cần "đổi hồ sơ" sang cách viết React.

| Angular | React | Ghi chú |
|---|---|---|
| `{{ expr }}` | `{expr}` | Ngoặc nhọn đơn; JSX đọc từ scope TS của hàm, không phải template context |
| `[src]="url"` | `src={url}` | Không có ngoặc vuông; mọi attribute động đều `={}` |
| `(click)="fn()"` | `onClick={fn}` | Truyền **tham chiếu hàm**, không gọi kèm `()` trừ khi bọc arrow |
| `[(ngModel)]="x"` | `value={x} onChange={e => setX(e.target.value)}` | Đẩy 2 chiều về 1 chiều + event; controlled input |
| `[class.active]="ok"` | `className={ok ? "active" : ""}` | Không có `class.binding`; dùng ternary hoặc clsx/cn |
| `[style.color]="c"` | `style={{ color: c }}` | Object camelCase (`backgroundColor`), không phải chuỗi CSS |
| `(keyup.enter)="..."` | `onKeyDown` + check `e.key === "Enter"` | Không có syntax sugar phím, tự check key |
| `Pipe` trong template (`\| date`) | Gọi hàm trong `{}` (`fmtDate.format(d)`) | Format là function thuần (chi tiết DAY 10) |
| `[attr.aria-label]="x"` | `aria-label={x}` | Attribute ARIA viết kebab-case như HTML, nhận `{}` bình thường |
| `for` (label) | `htmlFor` | `for` là keyword JS nên JSX đổi tên |
| `tabindex` | `tabIndex` | Mọi attribute DOM đều camelCase trong JSX |

> **Cách đọc bảng này:** mỗi dòng là một cặp "dịch thuật" Angular → React. Cột Angular cho bạn biết bạn đang cần làm gì (nếu quen Angular), cột React là cách viết tương đương, cột Ghi chú nêu điểm khác biệt dễ sập bẫy của cặp đó.

> **Tóm gọn 1 câu:** Bảng này là cuốn từ điển Anh–Việt cho template: tra cú pháp Angular quen thuộc, đọc ra cú pháp React tương đương ngay lập tức.

## Lỗi thường gặp (Common pitfalls)

Mục này liệt kê 9 lỗi kinh điển của DAY 1, mỗi lỗi có ví dụ chạy được. Đọc để biết "sểnh" ở đâu trước khi tự té.

### 1. `onClick={showInfo()}` thay vì `onClick={showInfo}`
Mô tả: hàm chạy *ngay lúc render*, không phải lúc click. Nút bấm không còn tác dụng, alert hiện khi mở trang.

> 📄 **Code ví dụ:** [`examples/11-1-onclick-showinfo-thay-vi-onclick-showinfo.tsx`](examples/11-1-onclick-showinfo-thay-vi-onclick-showinfo.tsx)

> 📄 **Code ví dụ:** [`examples/12-1-onclick-showinfo-thay-vi-onclick-showinfo.tsx`](examples/12-1-onclick-showinfo-thay-vi-onclick-showinfo.tsx)

### 2. Dùng `if`/`for` bên trong `{}`
Mô tả: `if`/`for` là statement, `{}` chỉ nhận expression → lỗi cú pháp.

> 📄 **Code ví dụ:** [`examples/13-2-dung-if-for-ben-trong.tsx`](examples/13-2-dung-if-for-ben-trong.tsx)

> 📄 **Code ví dụ:** [`examples/14-2-dung-if-for-ben-trong.tsx`](examples/14-2-dung-if-for-ben-trong.tsx)

### 3. Quên `onChange` → input đóng băng
Mô tả: giữ `value` mà không có `onChange`, gõ không vào, tưởng browser hỏng.

> 📄 **Code ví dụ:** [`examples/15-3-quen-onchange-input-ong-bang.tsx`](examples/15-3-quen-onchange-input-ong-bang.tsx)

> 📄 **Code ví dụ:** [`examples/16-3-quen-onchange-input-ong-bang.tsx`](examples/16-3-quen-onchange-input-ong-bang.tsx)

### 4. Set state từ giá trị cũ không dùng hàm
Mô tả: `setName(name + "!")` trong update nhanh (double-click, interval) có thể mất update vì `name` là snapshot cũ của render đó.

> 📄 **Code ví dụ:** [`examples/17-4-set-state-tu-gia-tri-cu-khong.tsx`](examples/17-4-set-state-tu-gia-tri-cu-khong.tsx)

> 📄 **Code ví dụ:** [`examples/18-4-set-state-tu-gia-tri-cu-khong.tsx`](examples/18-4-set-state-tu-gia-tri-cu-khong.tsx)

### 5. Render object trực tiếp
Mô tả: `{user}` ném "Objects are not valid as a React child", trang trắng.

> 📄 **Code ví dụ:** [`examples/19-5-render-object-truc-tiep.tsx`](examples/19-5-render-object-truc-tiep.tsx)

> 📄 **Code ví dụ:** [`examples/20-5-render-object-truc-tiep.tsx`](examples/20-5-render-object-truc-tiep.tsx)

### 6. Dùng `class` thay vì `className`
Mô tả: React cảnh báo `Invalid DOM property 'class'. Did you mean 'className'?`, style không áp dụng đúng.

> 📄 **Code ví dụ:** [`examples/21-6-dung-class-thay-vi-classname.tsx`](examples/21-6-dung-class-thay-vi-classname.tsx)

> 📄 **Code ví dụ:** [`examples/22-6-dung-class-thay-vi-classname.tsx`](examples/22-6-dung-class-thay-vi-classname.tsx)

### 7. `style="color:red"` (chuỗi)
Mô tả: TS lỗi type, runtime React bỏ qua.

> 📄 **Code ví dụ:** [`examples/23-7-style-color-red-chuoi.tsx`](examples/23-7-style-color-red-chuoi.tsx)

> 📄 **Code ví dụ:** [`examples/24-7-style-color-red-chuoi.tsx`](examples/24-7-style-color-red-chuoi.tsx)

### 8. `{count && ...}` khi count = 0 in ra "0"
Mô tả: `0` là giá trị render được, không bị bỏ qua như `false`.

> 📄 **Code ví dụ:** [`examples/25-8-count-khi-count-0-in-ra-0.tsx`](examples/25-8-count-khi-count-0-in-ra-0.tsx)

> 📄 **Code ví dụ:** [`examples/26-8-count-khi-count-0-in-ra-0.tsx`](examples/26-8-count-khi-count-0-in-ra-0.tsx)

### 9. `useState` đặt trong `if`
Mô tả: vi phạm rules of hooks — "Rendered more hooks than during the previous render" khi điều kiện đổi.

> 📄 **Code ví dụ:** [`examples/27-9-usestate-at-trong-if.tsx`](examples/27-9-usestate-at-trong-if.tsx)

> 📄 **Code ví dụ:** [`examples/28-9-usestate-at-trong-if.tsx`](examples/28-9-usestate-at-trong-if.tsx)

> **Tóm gọn 1 câu:** Chín lỗi đều có chung mẫu số: viết "theo bản năng HTML/JS" thay vì theo luật của JSX — mỗi lỗi có file ví dụ để chạy và tự thấy.

## Best practices / Mẹo

Mục này gom 8 mẹo viết JSX sạch và bền. Đọc sau khi nắm khái niệm để nâng chất lượng code ngay từ DAY 1.
- Đưa **logic format ra ngoài JSX** (biến/hàm trên đầu component) để JSX đọc như HTML sạch. Vì sao? Vì JSX lẫn logic dày đặc khó review; biến đặt tên tốt (`nextYear`, `isAdult`) tự tài liệu. Format nặng gộp vào `Intl`/hàm thuần (DAY 10).
- Dùng **derived data** thay vì state trùng lặp: `nextYear = user.age + 1` tính mỗi render là rẻ — đừng `useState` giá trị tính được. Vì sao? Vì hai nguồn (state + gốc) dễ lệch; derived luôn đúng.
- Tận dụng TS: type cho `user` và props; `onChange` tự suy kiểu, đừng khai `React.FormEvent` thủ công trừ khi cần. Vì sao? Để compile chặn sai kiểu sớm, IDE gợi ý đủ.
- Dùng fragment thay `<div>` thừa để DOM gọn và CSS layout dễ hơn. Vì sao? Vì `<div>` thừa phá flex/grid, fragment không tồn tại trong DOM.
- Với React Compiler 1.0, arrow function trong `onClick` được memo tự động — đừng vội `useCallback`. Vì sao? Vì memo thủ công tốn so sánh, Compiler làm đúng hơn.
- Giữ handler ngắn; handler phức tạp tách hàm đặt tên (`handleSubmit`) để dễ đọc và test. Vì sao? Vì JSX chỉ nên "vẽ", logic đặt tên ở trên dễ unit test.
- Đặt `aria-label`/`htmlFor` cho input/button — vừa a11y vừa giúp test `getByRole` (DAY 21). Vì sao? Vì query theo role/label bền trước refactor class/style.
- Giữ mỗi phần tử JSX đủ nhỏ để tách component khi nó bắt đầu phình to (quy tắc ngón tay: >80 dòng cân nhắc tách). Vì sao? Vì component nhỏ dễ memo, dễ test, dễ tái dùng.

> **Tóm gọn 1 câu:** Tám mẹo chung một hướng: JSX chỉ nên "vẽ" — logic tính trước, state không trùng lặp, TS chặn lỗi sớm, còn Compiler lo memo giúp bạn.

## Bài tập nhỏ
1. Thêm `{user.name.length}` và một ô input thứ 2 để sửa `age` (state riêng) — xem cả 2 dòng cập nhật đồng bộ. Vì sao cần state riêng cho `age` mà không sửa `user.age` trực tiếp?
2. Đổi input sang "không kiểm soát": bỏ `value`/`onChange`, dùng `ref` — so sánh hành vi (gõ có cập nhật `<h3>` không?), rồi giải thích vì sao controlled vẫn được khuyên dùng.
3. Thêm nút "Reset tên" gọi `setName(user.name)` và một nút "In hoa" gọi `setName((n) => n.toUpperCase())` — quan sát functional update khác gì `setName(name.toUpperCase())` khi bấm nhanh 2 lần.
4. Đổi `alert` sang hiển thị một `<p>` text bên dưới thay vì alert — giữ tinh thần "state-driven UI" (mọi output đều từ state, không gọi API trình duyệt chen ngang).

## Reference
- https://react.dev/learn/javascript-in-jsx-with-curly-braces
- https://react.dev/learn/responding-to-events
- https://react.dev/learn/sharing-state-between-components#controlled-and-uncontrolled-components
- https://react.dev/reference/react-dom/components/common
