# DAY 10 — Hỏi & Đáp: Memo & Format (pipe)

> File hỏi–đáp chi tiết cho `3_react-tutorial/10-memo-format`.
> Đọc kèm: `README.md` (lý thuyết) + `example.tsx` (Intl + useMemo + memo chạy được).

File này giải đáp các thắc mắc DAY 10: format kiểu pipe Angular đổi ra gì trong React, `memo` với `useMemo` khác nhau ra sao, và Compiler 1.0 đổi luật chơi cỡ nào. Đọc theo từng câu đang thắc mắc.

---

## 1. Angular pipe (`| date`, `| currency`) tương đương gì bên React?

**Hỏi:** Không có cú pháp `|` trong JSX thì format tiền/ngày thế nào?

**Đáp:**
- **Gọi hàm thuần ngay trong JSX.** Vì JSX là JS, "pipe" chỉ là function call:
  `{fmtVND.format(total)}` thay cho `{{ total | currency:"VND" }}`.
- Chuẩn modern JS là **`Intl` API**: `Intl.NumberFormat`, `Intl.DateTimeFormat`, `Intl.RelativeTimeFormat`.
  Đổi locale (DAY 18) thì tạo instance mới cho locale đó — không cần logic thủ công.
- `async` pipe không có tương đương hàm — sang `use()` + Suspense (DAY 12).

Ví von: pipe Angular là **máy xay có nút chuyên dụng** đặt trong bếp template; React thì dùng **máy xay cầm tay** (hàm JS) — cầm lên là dùng ở bất kỳ đâu, kể cả ngoài bếp.

> **Tóm gọn 1 câu:** React không có pipe — format chỉ là gọi hàm `Intl` thuần ngay trong JSX.

---

## 2. Vì sao `fmtVND` đặt ngoài component? Tạo trong render thì sao?

**Hỏi:** `new Intl.NumberFormat(...)` trong thân `App` có chạy không?

**Đáp:**
- Chạy được nhưng **tạo mới mỗi render** — tốn (khởi tạo Intl đắt) mà lợi ích bằng không vì config không đổi.
- Đặt ở **module scope** = tạo 1 lần, tái dùng mọi render — giống pure pipe được cache sẵn.
- Quy tắc chung: hằng số/instance không phụ thuộc props/state thì đưa ra ngoài component.

Ví von: đặt ngoài component như **mua một chiếc nồi dùng cả ngày**; tạo trong render là thuê nồi mới mỗi lần nấu — nấu 3 bữa thì thuê 3 cái, dù cái nào cũng y hệt.

> **Tóm gọn 1 câu:** Instance `Intl` không phụ thuộc props/state thì tạo 1 lần ở module scope — tạo trong render là phí tiền cho config không đổi.

---

## 3. `memo` là gì? Khi nào bọc component?

**Hỏi:** `memo(Row)` chặn được gì?

**Đáp:**
- `memo` chặn **re-render khi props shallow-equal**: cha re-render vì state khác, nhưng `Row` nhận `text`
  cùng giá trị → React bỏ qua render `Row` (kiểm chứng bằng `console.log` trong Row không chạy).
- Dùng cho **item list/component render thường xuyên** với props ít đổi. Không bọc bừa cả app —
  so sánh shallow cũng tốn, và sai deps còn ẩn bug.
- Trong example, `Row` nhận `text` là string (so sánh rẻ, chính xác) — đúng case klassik cho `memo`.

> **Tóm gọn 1 câu:** `memo` là "cánh cửa có kiểm tra props" — props giống hệt thì con đứng yên, nhưng đừng bọc bừa vì so sánh cũng có giá.

---

## 4. `useMemo` là gì? Khác `memo` ở đâu?

**Hỏi:** Hai cái tên gần giống nhau, phân biệt thế nào?

**Đáp:**
- `memo` bọc **component** (chặn render lại). `useMemo(fn, deps)` cache **giá trị tính toán nặng**
  (chỉ tính lại khi deps đổi).
- Trong example: `useMemo(() => rows.reduce(...), [rows])` — `rows` không đổi qua render nên tổng
  không tính lại, trả kết quả cache.
- `useMemo` không phải "tối ưu mọi thứ": cache tốn bộ nhớ + so sánh deps. Tính toán rẻ (cộng chuỗi,
  derived data DAY 1) thì tính thẳng, đừng bọc.

Ví von phân biệt hai cái tên: `memo` là **gác cổng cho cả ngôi nhà** (component), `useMemo` là **tủ lạnh cho một món đồ** (giá trị tính nặng) — nhà không đổi thì không vào, món không hỏng thì không nấu lại.

> **Tóm gọn 1 câu:** `memo` chặn render cả component, `useMemo` cache một giá trị tính nặng — cả hai đều chỉ đáng dùng khi việc tiết kiệm lớn hơn chi phí so sánh.

---

## 5. React Compiler 1.0 thay đổi gì? Có xóa hết `memo`/`useMemo` không?

**Hỏi:** Đã bật Compiler thì example này viết thế nào?

**Đáp:**
- Compiler (stable 10/2025) **tự memoize ở build-time**: bạn viết code tự nhiên
  (`rows.map(...)` thường, không `memo`/`useMemo`), bản build vẫn ít render thừa.
- Điều kiện: tuân **Rules of React** (render thuần, hooks top-level, deps đủ) + lint
  `eslint-plugin-react-hooks` v6 báo chỗ Compiler phải skip.
- Lộ trình thực tế: bật Compiler từ đầu, **giữ `memo`/`useMemo` đang có** (vô hại), chỉ gỡ dần khi đo
  thấy không cần — và chỉ thêm mới khi **đo được bottleneck** hoặc cần ref ổn định cho effect deps.

> **Tóm gọn 1 câu:** Compiler tự memoize ở build-time — viết tự nhiên, giữ memo cũ vô hại, chỉ thêm mới khi đo được bottleneck.

---

## 6. So nhanh Angular ↔ React cho format/memo?

**Hỏi:** Từng khái niệm pipe Angular tương đương gì?

**Đáp:**

| Angular | React | Ghi chú |
|---|---|---|
| `\| date` / `\| currency` | `Intl.*.format(...)` gọi trong JSX | Không cú pháp riêng |
| pure pipe (cache) | `Intl` instance ở module scope / `useMemo` | Tạo 1 lần |
| `OnPush` change detection | `memo` + Compiler | Cùng mục đích: bớt render thừa |
| `async` pipe | `use()` + Suspense (DAY 12) | Đọc promise trong render |

> **Cách đọc bảng này:** mỗi dòng là một pipe Angular và "twin" bên React — đọc cột Angular để nhận diện khái niệm quen, cột React là cách viết thay thế, cột Ghi chú nêu sự khác biệt ngắn nhất cần nhớ.

---

## 9. `memo` "chặn render lại" là sao? Giống OnPush của Angular? (Thực chiến)

**Hỏi:** Mặc định cha render thì con ra sao, `memo` chặn bằng cách nào?

**Đáp:** Mặc định React render kiểu "cha render → **mọi con render theo**", kể cả con không đổi gì.
`memo` bọc component để chặn cái đó: mỗi khi cha render, React **so props cũ vs mới** (nông từng field
bằng `Object.is`) — giống hệt thì bỏ qua render, tái dùng kết quả cũ. Vd: gõ ô tìm kiếm làm cha render,
1000 `Row` bọc `memo` mà `text` không đổi thì đứng yên hết.

3 giới hạn: **chỉ so nông** (prop object/function inline là miss — truyền nguyên thủy hoặc memo từ nguồn);
**không chặn render từ bên trong** (tự `setState`/context đổi vẫn render); **không miễn phí**
(component rẻ thì memo còn đắt hơn render lại — chỉ bọc thứ đắt sau khi đo).

So với Angular `OnPush` — giống mục đích, khác cơ chế:

| Điểm | Angular `OnPush` | React `memo` |
|---|---|---|
| Kích hoạt check | `@Input` đổi **tham chiếu**, event nội bộ, `async` pipe emit, `markForCheck()` tay | Cha render → so props cũ/mới, giống thì bỏ qua |
| So sánh | So **tham chiếu** `@Input` | So **nông từng prop** (`Object.is` mỗi field) |
| Phạm vi | Cả component + subtree ít bị check ké | Chỉ **1 component** được bọc |
| Ép cập nhật | `markForCheck()` / `detectChanges()` | `setState` bên trong tự render, không cần gọi gì |

**Bẫy chung cả hai:** mutate object thay vì tạo mới → tham chiếu không đổi → cả hai đều tưởng "không đổi" →
UI đơ. Nên cả 2 hệ đều bắt **immutable update**.

> **Cách đọc bảng này:** mỗi dòng là một khác biệt cơ chế giữa OnPush và memo. Cột giữa cho bạn biết React làm thế nào, cột đầu cho bạn biết Angular làm ra sao — đọc hàng khi muốn "dịch" từ framework này sang framework kia.

> **Tóm gọn 1 câu:** Cả bốn điểm khác nhau đều quy về một nguyên tắc: React so từng props (nông), Angular so từng tham chiếu Input; và cả hai đều sai khi object bị mutate thay vì tạo mới.

---

## Reference

- `README.md` + `example.tsx` trong cùng thư mục (DAY 10)
- https://react.dev/reference/react/memo · https://react.dev/reference/react/useMemo
- https://react.dev/learn/react-compiler
- https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl
