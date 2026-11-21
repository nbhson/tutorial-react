# Q44: Review code React của người khác, dấu hiệu nào cho thấy code chưa đúng chất React?

## Câu hỏi

> Review code React của team (đặc biệt người chuyển từ Angular hoặc JS thuần) — có những dấu hiệu nào cho thấy code đang "không React" (ngon từ Angular/JS)?
> Ví dụ: dùng `Class component` thay vì hook, dùng `Service` (DI) thay vì Context/prop, dùng `Subject`/`Observable` thay vì state, hay "viết React như Angular" (template-style, hai chiều binding, event-driven).

## Trả lời ngắn (elevator pitch, 30 giây)

Mục này là "bản nói 30 giây" — nhớ được nguyên tắc "state-driven" và 5 dấu hiệu là đã trả lời xong cốt lõi; phần chi tiết bên dưới để đỡ khi bị hỏi từng dấu hiệu.

- Code React "đúng chất" = **state-driven**: UI là hàm của state/props, mọi thay đổi đi qua `setState`, data chảy xuống — sự kiện chảy lên.
- **5 dấu hiệu review**: (1) Chọc DOM trực tiếp (`getElementById`, `innerHTML`) thay vì state/ref. (2) Class component còn sót trong codebase đã hooks. (3) Hai nguồn sự thật — DOM và state lệch nhau. (4) Effect làm việc của render: tính data từ props/state rồi `setState` trong effect. (5) Logic copy-paste giữa component thay vì tách custom hook.
- **Nguyên tắc một câu**: đọc code mà không chỉ ra được "state nào điều khiển UI này" thì có mùi.

## Trả lời chi tiết

Mục này liệt kê 5 "mùi" code Angular/JS thuần còn đọng lại khi người ta viết React, mỗi mùi kèm cách thay đúng — đọc để review code người khác mà chỉ ra được "đây là phong cách cũ, sửa thế này".

### 1. 5 "dấu hiệu code không React" (Q3, Q15, Q27)

| Dấu hiệu | Code không React | Code React đúng (Q3, Q15, Q27) | Vì sao sai (Q3, Q15) |
|---|---|---|---|
| **Class component (Q3)** | `class MyComponent` + `constructor` + `state = {}` (Q3) | `function MyComponent(props)` + `useState` (Q3, Q10) | Class deprecated (Q3), hook là chuẩn (Q5) |
| **Service (DI) (Q1, Q15)** | `@Injectable` + `inject(Service)` (Q1) | `useContext` (Q13) hoặc props (Q9) | DI không tồn tại trong React (Q1), dùng Context/props (Q9, Q13) |
| **`Subject`/`Observable` (Q1, Q15)** | `subject: Subject<T>` + `subscribe()` (Q1) | `useState` (Q10) | RxJS là Angular (Q1, Q15), state là React (Q10) |
| **"Template-style" (Q6)** | `*ngIf`, `*ngFor` (Q3) | `condition ? A : B` (Q6) hoặc `items.map(...)` (Q6, Q8) | Template là Angular (Q3), JSX là React (Q6) |
| **Event-driven (Q27)** | `emit()`, `EventEmitter` (Q3) | Callback (Q11) hoặc state (Q9, Q10) | Event-driven là Angular (Q27), state-driven là React (Q9) |

> **Cách đọc bảng này:** mỗi dòng là một "mùi" code mang phong cách Angular/JS cũ; cột giữa là kiểu viết cần phát hiện khi review, cột "Code React đúng" là thay thế chuẩn, cột "Vì sao sai" là lý lẽ để nói với tác giả — đọc theo đúng mùi bạn bắt gặp trong code.

Ví von tổng quát cho cả bảng: React "đúng chất" giống bảng giá điện tử — đổi một số, mọi người nhìn thấy luôn, không ai phải chạy đi thông báo cho từng người; còn event-driven là anh bạn chạy chân châm chim báo từng người một, thiếu một lần báo là có người ngồi nhìn giá cũ.

### 2. "Class component (Q3, Q5)" — thay bằng function hook (Q3, Q10)

> 📄 **Code ví dụ:** [`examples/01-2-class-component-q3-q5-thay-bang-function.tsx`](examples/01-2-class-component-q3-q5-thay-bang-function.tsx)

**Điểm ăn điểm (Q3, Q5, Q10)**: Class component (Q3) deprecated (Q3, Q5); hook (Q3) đúng (Q3, Q10).

### 3. "Service (DI) (Q1, Q15)" — thay bằng Context (Q13) hoặc props (Q9)

> 📄 **Code ví dụ:** [`examples/02-3-service-di-q1-q15-thay-bang-context.tsx`](examples/02-3-service-di-q1-q15-thay-bang-context.tsx)

**Điểm ăn điểm (Q1, Q15, Q13)**: Service (DI) (Q1, Q15) không tồn tại trong React (Q3); Context (Q13) đúng (Q3).

### 4. "RxJS (Subject/Observable) (Q1, Q15)" — thay bằng state (Q10)

> 📄 **Code ví dụ:** [`examples/03-4-rxjs-subject-observable-q1-q15-thay-bang.tsx`](examples/03-4-rxjs-subject-observable-q1-q15-thay-bang.tsx)

**Điểm ăn điểm (Q1, Q15, Q10)**: RxJS (Q1, Q15) không phù hợp; state (Q10) đúng (Q3).

### 5. "Template-style (Q6)" — thay bằng conditional rendering (Q6)

> 📄 **Code ví dụ:** [`examples/04-5-template-style-q6-thay-bang-conditional-rendering.tsx`](examples/04-5-template-style-q6-thay-bang-conditional-rendering.tsx)

**Điểm ăn điểm (Q6, Q8)**: Template (Q3, Angular); JSX (Q6, React).

### 6. "Event-driven (Q27)" — thay bằng state (Q9, Q10)

> 📄 **Code ví dụ:** [`examples/05-6-event-driven-q27-thay-bang-state-q9.tsx`](examples/05-6-event-driven-q27-thay-bang-state-q9.tsx)

**Điểm ăn điểm (Q9, Q10, Q11)**: Event-driven (Q27); state-driven (Q9, Q10) đúng (Q3).

## Bẫy khi phỏng vấn

Mục này là "bản đồ mìn": 4 câu trả lời nghe hợp lý nhưng sai — thường xuất hiện khi người trả lời "vẫn mang tư duy Angular/JS cũ" như đúng quy tắc.

1. **"Class component vẫn dùng tốt, chưa cần chuyển sang hook"** → **sai** (Q3, Q5): class đã deprecated, hook là chuẩn (Q3, Q10).
2. **"Inject Service kiểu DI cho tiện tái sử dụng"** → **sai** (Q1, Q15): DI không tồn tại trong React — dùng Context (Q13) hoặc props (Q9).
3. **"Dùng Subject/Observable (RxJS) để quản state"** → **sai** (Q1, Q15): đó là tư duy stream của Angular — state React là chuẩn (Q10).
4. **"Viết template-style kiểu `*ngIf`/`*ngFor`"** → **sai** (Q6): JSX là conditional rendering + `.map()` (Q6, Q8).

> **Tóm gọn 1 câu:** Code "không React" là code mang tư duy cũ (class, DI, stream, template, event) vào bộ mới — review là phải chỉ ra được "state nào điều khiển UI này", chỉ ra không được là có mùi.

## Gợi ý câu chốt

Mục này gói cả bài thành một đoạn trả lời mẫu — đọc để tập nói trọn một hơi rồi diễn đạt lại bằng giọng của mình.

> "Code không React (Q3, Q15, Q27) — 5 dấu hiệu (Q3, Q15): (1) **Class component (Q3, Q5)** (deprecated, hook đúng, Q10); (2) **Service (DI) (Q1, Q15)** (Q1, Context đúng, Q13); (3) **RxJS (Subject/Observable) (Q1, Q15)** (Q1, state đúng, Q10); (4) **Template (Q3, Q6)** (Angular-style, JSX đúng, Q6); (5) **Event-driven (Q27)** (Q27, state đúng, Q9). **Nguyên tắc (Q3, Q15, Q27)**: Code React = state-driven (Q9, Q10, Q13, Q27), không event-driven (Q27, Q3).

## Reference

- [`03-strictmode`](../03-strictmode/README.md) — "Class component (deprecated, function hook Q3, Q5)"
- [`15-external-stores`](../15-external-stores/README.md) — "Service (DI) (Q1, Q15); Context (Q13 đúng)"
- [`10-useref-vs-usestate`](../10-useref-vs-usestate/README.md) — "RxJS (Q1, Q15); state (Q10 đúng)"
- [`06-jsx`](../06-jsx/README.md) — "Template (Q3, Angular); JSX (Q6, React)"
- [`09-lifting-state-up`](../09-lifting-state-up/README.md) — "Event-driven (Q27); state (Q9 đúng)"

## Câu hỏi liên quan

- **Hỏi tiếp (liên tục)**: [Q3 — StrictMode (Q3, Q5)?](../03-strictmode/README.md) · [Q15 — External stores (Q1, Q15)?](../15-external-stores/README.md)
- **Đào sâu (xuyên nhóm)**: [Q10 — useRef vs useState (Q1, Q15)?](../10-useref-vs-usestate/README.md) · [Q6 — JSX (Q3, Q6)?](../06-jsx/README.md)
