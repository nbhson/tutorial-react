# DAY 4 — Hỏi & Đáp: Ref (biến tham chiếu template)

> File hỏi–đáp chi tiết cho `3_react-tutorial/4-ref-template-variable`.
> Đọc kèm: `README.md` (lý thuyết) + `example.tsx` (focus + timer id chạy được).

---

## 1. `useRef` là gì? Khác `useState` ở điểm nào?

**Hỏi:** `useRef` và `useState` đều "giữ giá trị", khác nhau thế nào?

**Đáp:**
- `useRef(init)` trả về một object `{ current }` **ổn định duy nhất** suốt vòng đời component.
  Đổi `.current` **không gây re-render** — ngược lại `useState` luôn re-render khi set.
- Quy tắc chọn: dữ liệu cần **hiển thị lên UI** → `useState`; dữ liệu chỉ cần **giữ để dùng**
  (node DOM, timer id, đếm render) → `useRef`.
- Trong example: `tick` hiển thị `<p>Tick: {tick}</p>` nên phải là state; `idRef` (id của interval)
  không hiển thị nên là ref — dùng state cho nó sẽ re-render thừa mỗi lần tạo timer.

---

## 2. `inputRef` và `idRef` trong example có quan hệ gì với nhau?

**Hỏi:** Hai ref này phối hợp với nhau thế nào?

**Đáp:**
- **Không quan hệ gì** — là 2 ví dụ độc lập về 2 công dụng khác nhau của `useRef`, đặt chung một file:

| | `inputRef` | `idRef` |
|---|---|---|
| Chứa gì | node DOM `<input>` (React tự gán qua `ref={...}`) | số id của timer (mình tự gán trong effect) |
| Ai gán | React, sau khi dựng DOM | mình, trong `useEffect` |
| Dùng khi nào | bấm nút Focus | cleanup khi unmount |
| Xóa 1 trong 2 | cái còn lại vẫn chạy bình thường | — |

- Điểm chung duy nhất: cả hai đều là "chiếc hộp `{ current }` tồn tại xuyên suốt render mà không gây re-render" —
  đó chính là bản chất của `useRef`.

---

## 3. Vì sao `inputRef` khởi tạo `null`? Khi nào `.current` mới có giá trị?

**Hỏi:** `useRef<HTMLInputElement>(null)` — lúc render đầu `.current` là gì?

**Đáp:**
- Lúc render đầu `.current` là `null` vì **DOM chưa được dựng** — React chỉ gán node thật vào ref
  **sau khi commit** (sau khi chèn vào trang).
- Vì vậy mọi chỗ đọc ref DOM đều phải chịu `null`: `inputRef.current?.focus()` (optional chaining),
  không gọi trực tiếp `inputRef.current.focus()` trong render.
- Code SSR cũng không được dựa vào `ref.current` lúc render — ref chỉ có sau khi client mount.

---

## 4. Vì sao `idRef` không dùng `useState`? Cất timer id vào state thì sao?

**Hỏi:** `const [id, setId] = useState()` rồi `setId(setInterval(...))` có được không?

**Đáp:**
- Chạy được nhưng **sai công cụ**: id của interval không hiển thị lên UI, set nó vào state gây
  **một lần re-render vô ích** (và nếu đặt sai chỗ còn dễ loop: render → tạo timer → set state → render...).
- `idRef.current = setInterval(...)` không render gì, object ref sống suốt vòng đời nên cleanup
  đọc lại đúng id đã tạo: `return () => clearInterval(idRef.current)`.

---

## 5. Ref là "escape hatch" nghĩa là gì? Khi nào được sờ DOM tay?

**Hỏi:** Nghe nói thao tác DOM bằng ref là "đi đường vòng", vậy khi nào mới được dùng?

**Đáp:**
- React muốn mọi UI là hệ quả của state/props (khai báo). Sờ DOM tay là **đi vòng quanh React**
  (imperative), nên chỉ dùng khi React **chưa có API trừu tượng hóa tốt hơn**:
  `focus()`, phát/dừng video-audio, scroll tới vị trí, **đo kích thước/vị trí** node.
- Cấm dùng ref để "vẽ UI thay state" (`ref.current.textContent = count`) — phá vỡ diff, StrictMode
  và Compiler đều không bảo vệ được pattern này.

---

## 6. React 19 đổi gì về `ref`? `forwardRef` còn cần không?

**Hỏi:** Trước đây truyền `ref` vào component con phải bọc `forwardRef`, giờ thì sao?

**Đáp:**
- React 19: **`ref` là prop bình thường** — `<MyInput ref={inputRef}>` không còn cảnh báo,
  component con nhận qua destructuring như mọi prop khác.
- `forwardRef` chỉ còn ý nghĩa **tương thích code cũ/thư viện chưa lên 19**. Code mới viết thẳng,
  không bọc.

---

## 7. `useImperativeHandle` để làm gì? Có nên lạm dụng?

**Hỏi:** Cha muốn gọi method của con (như `@ViewChild` gọi method public) thì sao?

**Đáp:**
- Con dùng `useImperativeHandle(ref, () => ({ focus: ..., reset: ... }))` để **lộ API chọn lọc**
  qua ref thay vì lộ cả node DOM.
- Dùng **khiêm tốn**: đa số giao tiếp cha-con giải quyết gọn bằng props/callback (DAY 3).
  Chỉ dùng khi thật sự cần lệnh imperative (focus, mở dialog, phát media) mà props diễn đạt rườm rà.

---

## 8. StrictMode + effect có timer thì sao? Vì sao không bỏ StrictMode?

**Hỏi:** Effect tạo interval chạy 2 lần ở dev (setup → cleanup → setup), có tốn 2 timer không?

**Đáp:**
- Không — lần setup đầu bị cleanup (`clearInterval`) ngay trước khi setup lại, cuối cùng chỉ còn **1 timer**.
  Chính nhờ chạy 2 lần mà effect thiếu cleanup (quên `clearInterval`) lộ ra ngay: timer nhân đôi ở dev.
- **Đừng bỏ StrictMode để "hết phiền"** — hãy viết effect đúng (setup/cleanup đối xứng, DAY 15).
  Prod chỉ chạy 1 lần nên không ảnh hưởng.

---

## 9. So nhanh Angular ↔ React cho ref?

**Hỏi:** `#template` + `@ViewChild` tương đương gì bên React?

**Đáp:**

| Angular | React | Ghi chú |
|---|---|---|
| `#myInput` template variable | `ref={inputRef}` | Cùng ý: đặt tên cho node DOM |
| `@ViewChild("myInput")` | `inputRef.current` sau mount | React đọc trực tiếp, không decorator |
| Gọi method public của con | `useImperativeHandle` | Dùng ít, ưu tiên props/callback |
| `forwardRef` (React cũ) | `ref` là prop thường (R19) | Code mới không bọc |

---

## 10. Angular đổi được DOM qua `@ViewChild`, sao `useRef` "không làm được"?

**Hỏi:** `@ViewChild` sửa DOM thoải mái, còn tutorial bảo ref không được vẽ UI — có phải `useRef` yếu hơn?

**Đáp:**
- **Nhầm lẫn phổ biến — `useRef` làm được y hệt**, chỉ là **không nên** dùng để vẽ UI. Khả năng như nhau, kỷ luật như nhau:

| | Angular `@ViewChild` | React `useRef` |
|---|---|---|
| Sửa được DOM | `nativeElement.focus()` / `.value = "x"` / `.style...` | `current?.focus()` / `.value = ...` / `.style...` |
| Sờ DOM để hiển thị dữ liệu | Lệch change detection, lần detect sau ghi đè | Lần re-render sau diff và vá đè |
| Được phép | `focus()`, scroll, phát media, **đo** kích thước | Y hệt: hành động imperative framework chưa trừu tượng hóa |

- Khác biệt không nằm ở "làm được hay không" mà ở triết lý chung cả hai framework:
  **đổi data (state), để framework lo DOM**. Muốn hiện `count` thì `{count}` trong JSX,
  không phải `ref.current.textContent = count`.

---

## 13. Ref trong thực tế dùng cho việc nào? (Usecase + quy tắc nhận diện)

**Hỏi:** Học `useRef` xong vẫn không biết khi nào dùng thật?

**Đáp:** 5 usecase gặp hàng ngày:
1. **Focus/select/scroll DOM** — mở modal focus ô đầu, chat cuộn xuống tin mới, nút "lên đầu trang".
2. **Gọi API thư viện ngoài** — `videoRef.play()`, `chartRef.update()`, `mapRef.flyTo()` (video.js, ECharts, Leaflet).
3. **Giữ giá trị không cần render** — id `setInterval` để cleanup, đếm submit chống double-submit, giá trị trước để so sánh.
4. **Đo kích thước/vị trí** — `getBoundingClientRect()` đặt tooltip/dropdown, `ResizeObserver` vẽ responsive (ref giữ observer + state giữ con số).
5. **`useImperativeHandle`** (hiếm) — cha gọi 1–2 hành động của con (`formRef.submit()`) mà vẫn giấu DOM thật.

**Quy tắc nhận diện:** việc đó dùng state cũng xong thì dùng state; chỉ chạm ref khi "đổi mà không muốn render"
hoặc "React không có API cho việc này".

---

## Reference

- `README.md` + `example.tsx` trong cùng thư mục (DAY 4)
- https://react.dev/reference/react/useRef
- https://react.dev/reference/react/useImperativeHandle
- https://react.dev/learn/manipulating-the-dom-with-refs
