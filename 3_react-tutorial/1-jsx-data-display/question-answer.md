# DAY 1 — Hỏi & Đáp: JSX & Hiển thị dữ liệu

> File hỏi–đáp chi tiết cho `3_react-tutorial/1-jsx-data-display`.
> Đọc kèm: `README.md` (lý thuyết) + `example.tsx` (controlled input chạy được).

File này giải đáp 10 câu hỏi thường gặp nhất về JSX và hiển thị dữ liệu — từ "JSX là gì" đến batching của `setState`. Đọc tuần tự như một buổi hỏi–đáp, hoặc tra theo câu đang thắc mắc.

---

## 1. JSX thực chất là gì? Có phải template string hay HTML?

**Hỏi:** JSX nhìn giống HTML, vậy nó là HTML, string, hay thứ gì khác?

**Đáp:**
- JSX **không phải HTML, không phải string**. Nó là cú pháp mở rộng của TypeScript, được Vite
  (qua esbuild/Babel) biên dịch thành lời gọi hàm `jsx(type, props)` trả về **object mô tả UI** (React element).
- Vì là code nên mọi chỗ trong JSX đều là TS thật: biến, hàm, import, type đều dùng được.
- Hệ quả: JSX tuân thủ luật TS — sai type props báo đỏ lúc compile, không đợi chạy mới biết.

Ví von: JSX như **đơn đặt món viết trên giấy order** — không phải món ăn (HTML), không phải lời kể (string), mà là tờ giấy có cấu trúc để "bếp" (compiler) đọc và chuẩn bị đúng.

> 📄 **Code ví dụ:** [`examples/01-1-jsx-thuc-chat-la-gi-co-phai.tsx`](examples/01-1-jsx-thuc-chat-la-gi-co-phai.tsx)

> **Tóm gọn 1 câu:** JSX là cú pháp TS được dịch thành object mô tả UI — vì là code thật nên sai kiểu là báo đỏ ngay lúc compile.

---

## 2. `{expression}` là gì? Cái gì được phép bỏ vào `{}`?

**Hỏi:** Trong `{}` được viết những gì? Vì sao `if`/`for` báo lỗi?

**Đáp:**
- `{}` là **cửa ngõ duy nhất** đưa dữ liệu TS vào JSX. Bên trong chỉ chấp nhận **expression**
  (biểu thức có giá trị): biến, phép toán, gọi hàm, ternary, template string, `.map()`.
- `if`/`for` là **statement** (câu lệnh, không trả giá trị) nên **không** viết trực tiếp trong `{}`.
  Muốn rẽ nhánh/lặp thì dùng ternary, `&&`, hoặc `.map()` — hoặc tính trước ra biến rồi nhúng biến vào.

Ví von: `{}` chỉ nhận thứ **trả được về giá trị**, như cân chỉ nhận đồ vật chứ không nhận "hành động cầm đồ lên" — muốn "hành động" thì làm trước, rồi đặt kết quả lên cân.

> 📄 **Code ví dụ:** [`examples/02-2-expression-la-gi-cai-gi-uoc-phep.tsx`](examples/02-2-expression-la-gi-cai-gi-uoc-phep.tsx)

> **Tóm gọn 1 câu:** `{}` là cửa ngõ đưa dữ liệu vào JSX và chỉ nhận expression — muốn `if`/`for` thì biến thành ternary/`&&`/`.map()` hoặc tính ra biến trước.

---

## 3. `{}` render được gì và không render được gì?

**Hỏi:** Vì sao `{user}` crash còn `{name}` thì chạy? `true`/`null` đi đâu?

**Đáp:**
- Render được: string, number, element JSX, mảng element (có `key`).
- **Không render trực tiếp:** plain object (`{user}` → lỗi *"Objects are not valid as a React child"*).
  Muốn hiện object thì chọn field (`{user.name}`) hoặc `JSON.stringify(user)`.
- **Bị bỏ qua lặng lẽ:** `true`, `false`, `null`, `undefined` không vẽ gì. Đây chính là nền của pattern
  `{cond && <span/>}` và `{cond ? <A/> : null}` (học kỹ ở DAY 2).
- Cạm bẫy kinh điển: `{count && <p/>}` khi `count = 0` sẽ in ra số **"0"** (vì `0` vẫn render được).
  Muốn ẩn khi 0 thì viết tường minh `{count > 0 && <p/>}`.

> **Tóm gọn 1 câu:** `{}` render được string/number/JSX, bỏ qua `true`/`false`/`null`/`undefined` — nhưng crash với object trần và in "0" oan nếu `&&` không so sánh tường minh.

---

## 4. Attribute binding trong React viết thế nào? (So với `[src]`, `[class]`, `[style]`)

**Hỏi:** Angular có `[src]`, `[class.active]`, `[style.color]` — React tương đương ra sao?

**Đáp:**
- React **không có ngoặc vuông**: attribute nào cần dữ liệu động thì gán `{expr}` trực tiếp.
- Vài tên đổi theo DOM property (camelCase): `class` → `className`, `for` → `htmlFor`,
  `onkeydown` → `onKeyDown`, `tabindex` → `tabIndex`.
- `style` nhận **object camelCase**, không phải chuỗi CSS: `style={{ color: "red", backgroundColor: "#fff" }}`.
  Hai ngoặc `{{ }}`: ngoặc ngoài là "nhúng expression", ngoặc trong là "object literal".

Ví von: nếu Angular cần "ngoặc vuông nhấn mạnh cái này là dữ liệu động", thì React tin rằng **mọi attribute trong ngoặc nhọn đều là dữ liệu động sẵn** — không cần nhấn thêm.

> 📄 **Code ví dụ:** [`examples/03-4-attribute-binding-trong-react-viet-the-nao.tsx`](examples/03-4-attribute-binding-trong-react-viet-the-nao.tsx)

> **Tóm gọn 1 câu:** React gán dữ liệu động bằng `{expr}` — nhớ bộ đổi tên `className`/`htmlFor`/`tabIndex` và `style` nhận object camelCase.

---

## 5. Event binding: vì sao `onClick={fn}` mà không phải `onClick={fn()}`?

**Hỏi:** Truyền handler cho `onClick`/`onChange` thế nào cho đúng? Khi nào cần arrow bọc ngoài?

**Đáp:**
- Event props (`onClick`, `onChange`, ...) cần nhận **tham chiếu hàm** — React sẽ *gọi khi sự kiện xảy ra*.
  Viết `onClick={showInfo()}` là **gọi ngay lúc render**, vừa sai thời điểm vừa có thể gây loop.
- Cần truyền tham số thì bọc arrow: `onClick={() => showInfo(id)}`. Arrow tạo hàm mới mỗi render,
  nhưng với React Compiler 1.0 việc này được memo tự động — không cần `useCallback` vội.
- Với React Compiler, chỉ `useCallback` khi đã đo thấy bottleneck hoặc cần ref ổn định cho API ngoài.

Ví von: `onClick={fn}` là **đưa số điện thoại** cho React ("cần thì gọi"), còn `onClick={fn()` là **bấm số gọi luôn ngay lúc đưa máy** — hoàn toàn sai thời điểm.

> 📄 **Code ví dụ:** [`examples/04-5-event-binding-vi-sao-onclick-fn-ma.tsx`](examples/04-5-event-binding-vi-sao-onclick-fn-ma.tsx)

> **Tóm gọn 1 câu:** Truyền tham chiếu hàm (`{fn}`), không gọi sẵn (`{fn()}`); cần tham số thì bọc arrow — và Compiler sẽ lo memo giúp.

---

## 6. `e` trong `onChange={(e) => ...}` là gì? Có phải event DOM thuần?

**Hỏi:** `e.target.value` lấy ở đâu ra? Có cần khai báo kiểu cho `e` không?

**Đáp:**
- `e` là **SyntheticEvent** — wrapper thống nhất của React quanh event trình duyệt, có sẵn
  `preventDefault`/`stopPropagation`, hành vi đồng nhất cross-browser.
- Trong `<input onChange={(e) => setName(e.target.value)} />`, TS **tự suy ra**
  `e: React.ChangeEvent<HTMLInputElement>` từ context nên bạn không cần khai type thủ công.
  Chỉ khai tường minh khi tách handler ra hàm riêng ngoài JSX.
- `e.target.value` là text hiện tại trong ô input tại thời điểm gõ.

> **Tóm gọn 1 câu:** `e` là SyntheticEvent — bộ đồng phục thống nhất React khoác cho event trình duyệt; TS tự suy kiểu, bạn chỉ cần lấy `e.target.value`.

---

## 7. Controlled input là gì? Vì sao bỏ `onChange` thì input "đứng im"?

**Hỏi:** Cặp `value` + `onChange` có gì đặc biệt? Bỏ một trong hai thì sao?

**Đáp:**
- **Controlled input = single source of truth là state:** `value={name}` (state → DOM),
  `onChange={e => setName(...)}` (DOM → state). Hai chiều Angular `[(ngModel)]` được tách thành
  **một chiều data + một chiều event** rõ ràng.
- Bỏ `onChange` mà giữ `value` → input thành **"frozen"**: React luôn ép DOM về đúng state cũ
  nên gõ không thay đổi gì (đọc được mà không ghi được).
- Bỏ `value` mà giữ `onChange` → thành **uncontrolled**: DOM tự giữ giá trị, state chỉ "nghe ké".
  Uncontrolled (`defaultValue` + `ref`) ít dùng, chỉ hợp cho form rất lớn cần tránh re-render mỗi phím gõ (DAY 11).

Ví von: controlled input như **quầy thu ngân giữ sổ chính** — khách nói gì (gõ) đều phải ghi vào sổ (state), rồi màn hình đọc từ sổ; bỏ `onChange` là sổ không ai ghi, màn hình hiện đúng bản cũ mãi.

> 📄 **Code ví dụ:** [`examples/05-7-controlled-input-la-gi-vi-sao-bo.tsx`](examples/05-7-controlled-input-la-gi-vi-sao-bo.tsx)

> **Tóm gọn 1 câu:** Controlled input = state là nguồn sự thật duy nhất: `value` chảy ra màn hình, `onChange` bơm từ bàn phím vào — mất một chiều là input "đứng im".

---

## 8. Fragment `<>...</>` để làm gì? Khác gì `<div>`?

**Hỏi:** Vì sao example bọc mọi thứ trong `<>...</>`? Dùng `<div>` có sao không?

**Đáp:**
- Một component chỉ được return **một node gốc**. Fragment nhóm nhiều element mà **không thêm node DOM thừa**,
  tương đương `ng-container` của Angular.
- Dùng `<div>` bọc cũng chạy, nhưng DOM phình thêm một tầng vô nghĩa → CSS layout (flex/grid) dễ lệch,
  DevTools rối. Quy tắc: cần nhóm thuần túy thì dùng fragment; chỉ dùng `<div>` khi thật sự cần style/box.

> **Tóm gọn 1 câu:** Fragment là "túi không hình" gom nhiều element cho đủ quy tắc một node gốc — đỡ một tầng `<div>` vô nghĩa làm lệch layout.

---

## 9. Dữ liệu "tính được" (derived data) có cần `useState` không?

**Hỏi:** `Next year: {user.age + 1}` có nên lưu vào state riêng?

**Đáp:**
- **Không.** Giá trị tính được từ state/props (derived data) thì **tính ngay khi render**, đừng `useState` thêm.
  State trùng lặp dễ lệch nhau (quên sync), code dài mà không lợi gì.
- Chỉ `useState` cho dữ liệu **độc lập, do user/hệ thống sinh ra** (text đang gõ, toggle, data từ server).
  Mọi thứ suy ra được (`fullName`, `total`, `nextYear`) thì tính inline hoặc qua biến/hàm thuần.

Ví von: derived data giống **tính tiền thừa từ tiền khách đưa** — khách đưa 100k là "state", tiền thừa 90k là kết quả tính ra; không ai cất riêng tiền thừa vào két (state riêng) rồi lo đồng bộ hai số.

> 📄 **Code ví dụ:** [`examples/06-9-du-lieu-tinh-uoc-derived-data-co.tsx`](examples/06-9-du-lieu-tinh-uoc-derived-data-co.tsx)

> **Tóm gọn 1 câu:** Suy ra được thì tính lúc render, đừng `useState` thêm — state chỉ dành cho dữ liệu độc lập sinh ra từ ngoài.

---

## 10. Nhiều `setState` trong một event có re-render nhiều lần?

**Hỏi:** Gọi 3 lần `setName` liên tiếp thì render 3 lần?

**Đáp:**
- **Không.** React **batching**: gộp mọi `setState` trong cùng một event handler thành **một lần re-render**.
- Muốn update dựa trên giá trị trước (đếm, nối chuỗi nhanh) thì dùng **functional update**
  `setName(prev => prev + "!")` để không mất update khi batching/dồn event.

Ví von: batching như **gom đơn hàng cùng địa chỉ vào một chuyến xe** — 3 món đặt liên tiếp vẫn giao một chuyến (một render); functional update là ghi chú "tính trên số dư hiện tại" để không giao nhầm theo giá cũ.

> **Tóm gọn 1 câu:** 3 lần `setState` trong một event = 1 lần render nhờ batching — dựa trên giá trị trước thì dùng functional update `prev => ...`.

---

## Reference

- `README.md` + `example.tsx` trong cùng thư mục (DAY 1)
- https://react.dev/learn/javascript-in-jsx-with-curly-braces
- https://react.dev/learn/responding-to-events
- https://react.dev/learn/sharing-state-between-components#controlled-and-uncontrolled-components
- https://react.dev/reference/react-dom/components/common
