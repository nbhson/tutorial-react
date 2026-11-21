# 10. Forms (controlled components)

> ⚠️ LEGACY: class + controlled inputs. Hiện nay: function + `useState` (pattern controlled giữ nguyên).
> Đối chiếu AngularJS `3_ng-model-directive` (two-way binding tự động).

## Mục tiêu bài học
- Hiểu khái niệm **controlled component**: input "khóa" vào state (`value={state.x}` + `onChange` setState).
- Xử lý nhiều loại field: text, select, checkbox (`checked` thay vì `value`).
- Thấy lợi ích của controlled: luồng dữ liệu một chiều rõ ràng, dễ validate, dễ debug.

## Khái niệm cốt lõi (Core)

Mục này giải thích "controlled component" — cách React thay thế two-way binding của `ng-model`. Đọc để hiểu vì sao form React viết dài hơn nhưng dễ kiểm soát hơn.

- AngularJS: `ng-model` = **two-way binding** — gõ vào input thì biến đổi, đổi biến thì input đổi. Tự động, không cần code.
- React: **không có two-way binding**. Mỗi input là *controlled*: giá trị luôn lấy từ state (`value={s.name}`), và mọi thay đổi qua `onChange` phải được đưa lên state. Nhìn có vẻ dài hơn, nhưng mỗi lần đổi giá trị bạn đều "đi qua" state → validate, transform, log đều dễ.
- Quy tắc field:
  - Text/number...: `value` + `onChange` (đọc `e.target.value`).
  - Checkbox: **`checked`** + `onChange` (đọc `e.target.checked`).
  - Select: `value` + `onChange` (option so khớp value).
- Kỹ thuật gọn: dùng `name` của input làm key → một handler `handleField` cho mọi field.
- **So với `ng-model`**: `ng-model` cho bạn binding "hai chiều" miễn phí nhưng khó kiểm soát thời điểm/validate; controlled input của React dài hơn nhưng mọi thay đổi đều chạy qua hàm của bạn — nơi bạn có thể chặn, biến đổi, cảnh báo.
- **`defaultValue` vs `value`**: `value` + `onChange` = controlled; `defaultValue` (không có onChange) = uncontrolled — input tự giữ giá trị, React không theo dõi. Trong bài này dùng hết controlled để thấy rõ luồng.

Ví von dễ nhớ: input controlled giống nhân viên thu ngân bắt khách đặt cọc — mọi tiền (giá trị) đi qua quầy (state) trước khi vào túi; uncontrolled thì khách tự giữ tiền, bạn không biết trong túi có bao nhiêu cho đến khi hỏi trực tiếp.

> **Tóm gọn 1 câu:** Controlled input là "mọi ký tự phải báo cáo về state" — viết dài hơn `ng-model` một chút, nhưng đổi lại bạn nắm toàn quyền kiểm soát và validate.

### Keyword chính
`controlled component` · `value` + `onChange` · `e.target.value/checked` · `defaultValue` · `ng-model`.

## Luồng hoạt động (Flow)
1. `FormsDemo` khởi tạo state `{ name: "", email: "", city: "hanoi", agree: false }`.
2. Mỗi input gắn `value={s.field}` + `onChange={this.handleField}`; `handleField` đọc `e.target.name` để biết field nào, `type` để biết đọc `checked` hay `value`, rồi `setState({ [name]: value })`.
3. Gõ ký tự → onChange → setState → re-render → input hiển thị đúng giá trị mới (vòng khép "một chiều": DOM → state → DOM).
4. Check "Đồng ý" → `e.target.checked` (boolean) được lưu vào `s.agree`.
5. Bấm Gửi → `handleSubmit` → `e.preventDefault()` → `alert(JSON.stringify(state))` — state là "nguồn sự thật" duy nhất.
6. `<pre>{JSON.stringify(s, null, 2)}</pre>` hiển thị state sống để quan sát.

**Chạy:** mở `index.html`, nhập form và xem state hiển thị trực tiếp.

## Ví dụ chi tiết
> 📄 **Code ví dụ:** [`examples/01-vi-du-chi-tiet.jsx`](examples/01-vi-du-chi-tiet.jsx)

## Giải thích từng phần
- **`<input value={s.name} onChange={this.handleField} />`**: chuỗi khép kín — input không tự "nhớ" giá trị, mọi thứ đọc từ `s.name`. Đây chính là định nghĩa controlled.
- **`e.target.name`**: mỗi field khai báo `name` trùng key state → một handler dùng chung, không cần viết 1 handler/field.
- **`t.type === "checkbox" ? t.checked : t.value`**: checkbox "giá trị" là boolean `checked` — nếu đọc `value` sẽ luôn ra string `"on"`/rỗng, sai ý đồ. Select/text/… đọc `value`.
- **`this.setState({ [t.name]: value })`**: computed property ES6 — `{ [t.name]: value }` thành `{ name: "..." }` tùy field. Gọn và tránh lặp code.
- **`JSON.stringify(s, null, 2)`**: "console" sống trên UI — thấy rõ mỗi lần gõ state đổi, minh họa rằng UI luôn là ảnh của state.

## So sánh AngularJS ↔ React (bảng markdown)

Bảng này đối chiếu từng loại field của form: cách AngularJS làm tự động vs cách React làm bằng tay — đọc ngang để thấy đánh đổi "tiện" lấy "kiểm soát".

| AngularJS | React legacy | Ghi chú |
|---|---|---|
| `ng-model="name"` (2 chiều tự động) | `value={s.name}` + `onChange` | React viết tay nhưng rõ ràng |
| `ng-checked="agree"` | `checked={s.agree}` | Checkbox là boolean |
| `ng-options`/`<option ng-repeat>` | `<option value=...>` + `value={s.city}` | So khớp theo value |
| `$scope.user = {...}` toàn bộ | state `[t.name]: value` từng field | Cùng mô hình object |
| Validate trong $watch | Validate ngay trong onChange/handler | Dễ thêm ở một nơi |

> **Cách đọc bảng này:** mỗi dòng là một loại tình huống form (text, checkbox, select, validate); cột *Ghi chú* là phần "vì sao" — đọc nó để hiểu không chỉ dịch cú pháp mà thay đổi mô hình luồng dữ liệu.

> **Tóm gọn 1 câu:** `ng-model` cho bạn two-way miễn phí nhưng "hộp đen"; controlled input bắt bạn viết tay, bù lại mọi thứ đều nhìn thấy được.

## Lỗi thường gặp (Common pitfalls)

Form là nơi lỗi nhiều nhất vì có nhiều loại field — mục này gom các bẫy kinh điển, đặc biệt là cặp `value`/`onChange` và checkbox.

- **Dùng `value` không kèm `onChange`** → input "đơ", không gõ được (React đè giá trị về state). → Luôn đi cặp `value` + `onChange` nếu controlled.
- **Đọc `e.target.value` cho checkbox** → luôn nhận chuỗi, đặt sai boolean. → Dùng `e.target.checked`.
- **Làm controlled nhưng quên setState** → gõ rồi nó lại nhảy về giá trị cũ — cảm giác "mất chữ". → setState phải chạy mỗi onChange.
- **Viết 1 handler/field** (name/email/city/agree) → code dài. → Dùng `name` + computed property trong một `handleField`.
- **Quên `e.preventDefault()` khi submit** → trang reload rồi state mất. → Luôn chặn trước khi xử lý.
- **Dùng `value` cho `<select multiple>` với mảng** — phải là mảng, không phải chuỗi. → Truyền array qua `value`, xử lý `Array.from(e.target.selectedOptions)`.
- **Chỉ đặt `name` ở một field nhưng dùng chung handler** → `[t.name]` thành `undefined`. → Mỗi field dùng `handleField` phải có `name` trùng key state.

> **Tóm gọn 1 câu:** Controlled form có một quy tắc vàng: `value`/`checked` đi cặp với `onChange`, và mọi thay đổi phải qua `setState` — thiếu một mắt xích là input "đơ" hoặc "mất chữ".

## Best practices / Mẹo
- Controlled là lựa chọn mặc định trong React — chịu khó viết dài hơn để có "single source of truth".
- Validate ngay trong handler: nếu email sai thì đặt thêm `error` vào state và render thông báo.
- Muốn đơn giản (input khởi tạo 1 lần, không cần theo dõi): dùng `defaultValue` (uncontrolled) — nhưng ít gặp hơn.
- Validate ngay trong `handleField` hoặc `handleSubmit`; lưu thông báo lỗi vào state và render cạnh field tương ứng.

## Bài tập nhỏ

Hai bài này cho bạn tập thêm field mới và cảm nhận "mọi thứ chảy từ state" — làm xong sẽ hiểu sâu controlled là gì.

1. Thêm field `note` (textarea) dùng chung `handleField` — thêm dòng validate: nếu `name` rỗng khi submit thì hiện lỗi đỏ thay vì alert.
2. Thêm nút "Điền mẫu" đặt `setState({name:"Geeks", email:"geeks@example.com"})` — xem toàn bộ form cập nhật một lượt từ state.

## Reference
- https://legacy.reactjs.org/docs/forms.html
- https://legacy.reactjs.org/docs/uncontrolled-components.html
- https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Property_Accessors (computed property)