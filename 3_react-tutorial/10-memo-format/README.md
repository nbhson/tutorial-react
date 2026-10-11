# DAY 10: MEMO & FORMAT (PIPE)

## Mục tiêu bài học
- Thay khái niệm Angular Pipe bằng tư duy "format là function": `Intl` API + hàm thuần + `useMemo`/Compiler để cache.
- Hiểu `memo` và `useMemo` hoạt động thế nào, và **vì sao React 19.3 + Compiler 1.0 khiến bạn hầu như không cần tự memo** — đo trước, memo sau.
- Biết `use()` + Suspense thay cho `async` pipe (gợi ý sang DAY 12-13).

## Khái niệm cốt lõi (Core)
- **Angular Pipe (`| date`, `| currency`) là cú pháp template.** React không có pipe — bạn viết hàm format thuần gọi ngay trong JSX: `{fmtVND.format(total)}`. Vì JSX là JS, "pipe" chỉ là function call.
- **`Intl` API là "pipe chuẩn" của modern JS:** `Intl.NumberFormat`, `Intl.DateTimeFormat`, `Intl.RelativeTimeFormat` cache instance ngoài component (tạo 1 lần) — hiệu năng tốt hơn tạo mới mỗi render.
- **`useMemo(fn, deps)`: cache kết quả tính toán nặng** — chỉ tính lại khi `deps` đổi. Không phải để "tối ưu mọi thứ": cache có chi phí bộ nhớ + so sánh deps.
- **`memo(Component)`: chặn re-render component khi props không đổi** (so sánh shallow). Dùng cho item list/component render thường.
- **React Compiler 1.0 (mặc định 2026):** tự động memo hóa re-render + function/object — bạn viết code đơn giản (chính là code ở DAY 1–9), Compiler tối ưu render. `useMemo`/`memo` chỉ thêm **khi đo được vấn đề** hoặc cần tham chiếu ổn định cho `useEffect` deps.
- **Keyword chính:** `Intl`, `Intl.NumberFormat`, `Intl.DateTimeFormat`, `useMemo`, `memo`, React Compiler, `pure function`, `async pipe` → `use()`/Suspense.

## Luồng hoạt động (Flow)
1. Module load: tạo 1 instance `fmtVND` (vi-VN, VND) và `fmtDate` (vi-VN, medium) ngoài component — tái sử dụng mọi render.
2. `App` render: `rows` (mảng số) cố định. `useMemo(() => rows.reduce(...), [rows])` tính tổng — với `rows` không đổi qua render, **không tính lại**, trả tổng cache.
3. `rows.map(...)` tạo `<Row key={i} text={fmtVND.format(r)} />` — `Row` được bọc `memo`.
4. Khi `App` re-render vì lý do khác (giả sử có state ngoài), `Row` nhận `text` cùng giá trị → `memo` so shallow → **không re-render Row**.
5. Hiển thị: mỗi dòng tiền format đúng locale, tổng format đúng.
6. (Nếu dùng Compiler 1.0: bước 3–4 xảy ra tự động — bạn chỉ viết `rows.map(...)` thường, không cần `memo`.)
7. Đổi locale (DAY 18) → tạo instance `Intl` mới cho locale đó (hoặc `useMemo` theo locale) → chuỗi format đổi, không cần logic thủ công.
8. Nếu `theme` state ở `App` đổi, `App` re-render; `memo` chặn `Row` re-render vì `text` không đổi — `console.log` trong Row không chạy.
9. Bỏ `memo` để so sánh: mọi `Row` re-render dù `text` giữ nguyên → thấy rõ giá trị của memo khi chưa có Compiler.
10. Bật Compiler: gỡ `memo`/`useMemo`, chạy lại — số lần render vẫn thấp, đúng tinh thần "viết tự nhiên, để Compiler lo".

## Ví dụ chi tiết
```tsx
// example.tsx — DAY 10: format + useMemo
import { memo, useMemo } from "react";

// Instance Intl tạo 1 lần ở module scope — giống pure pipe cache sẵn
const fmtVND = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" });

// memo: chỉ re-render khi text đổi (shallow compare props)
const Row = memo(function Row({ text }: { text: string }) {
  return <li>{text}</li>;
});

export default function App() {
  const rows = [120000, 45000, 89000];
  // useMemo: tổng chỉ tính lại khi rows đổi
  const total = useMemo(() => rows.reduce((a, b) => a + b, 0), [rows]);
  return (
    <>
      <ul>{rows.map((r, i) => <Row key={i} text={fmtVND.format(r)} />)}</ul>
      <p>Tổng: {fmtVND.format(total)}</p>
    </>
  );
}
```

Các "pipe" thường dùng khác (ngày, tương đối):

```tsx
const fmtDate = new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium" });
const fmtRelative = new Intl.RelativeTimeFormat("vi-VN", { numeric: "auto" });

fmtDate.format(new Date());     // "11 thg 10, 2026"
fmtRelative.format(-2, "day");  // "2 ngày trước"
```

React Compiler: cùng component, không cần memo thủ công:

```tsx
// Trước: tự tối ưu bằng memo + useMemo
const Row = memo(({ text }: { text: string }) => <li>{text}</li>);
const total = useMemo(() => rows.reduce((a, b) => a + b, 0), [rows]);

// Sau (Compiler 1.0 bật): viết tự nhiên, Compiler tự memo hóa
function Row({ text }: { text: string }) { return <li>{text}</li>; }
const total = rows.reduce((a, b) => a + b, 0);
```

Gom format vào module dùng chung:

```ts
// src/utils/format.ts — tái dùng, dễ test
const vnd = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" });
const date = new Intl.DateTimeFormat("vi-VN", { dateStyle: "short" });

export const fmtVND = (n: number) => vnd.format(n);
export const fmtDate = (d: Date) => date.format(d);
```

## Giải thích từng phần
- `new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" })`: "pipe currency" — luôn định dạng `120.000 ₫` kiểu Việt Nam. Đặt ngoài component = không tạo mới mỗi render, giống pure pipe có `pure: true`.
- `fmtVND.format(r)`: gọi function trong JSX — không cần cú pháp `|`. Nếu muốn "giống pipe", gom thành helper `vnd(n)`.
- `memo(function Row({ text }) {...})`: so props cũ/mới bằng `Object.is` từng key; `text` là string nên so nhanh. Khi list dài + cha re-render thường xuyên, tiết kiệm đáng kể.
- `useMemo(() => rows.reduce(...), [rows])`: `rows` là mảng **tham chiếu** — nếu luôn tạo mới ở cha thì deps đổi mỗi lần, cache vô dụng. Kỷ luật: dữ liệu bất biến (không mutate), mảng ổn định.
- **Compiler lưu ý:** ví dụ này minh họa cơ chế. Trong app thật với Compiler 1.0, bạn có thể bỏ `memo`/`useMemo` trừ khi đo mới thấy hồi quy; Compiler tự làm tương đương.
- **`Intl.DateTimeFormat`** cũng nên tạo 1 lần: `new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium" })` → `fmtDate.format(new Date())` cho "11 thg 10, 2026".
- **`Intl.RelativeTimeFormat`:** "2 ngày trước" theo locale — `new Intl.RelativeTimeFormat("vi").format(-2, "day")`.
- **Hàm format thuần:** `const vnd = (n: number) => fmtVND.format(n)` — dễ mock/test và đọc như "pipe" trong JSX.
- **`memo` so sánh shallow:** props object lồng sâu vẫn coi là đổi nếu tham chiếu con đổi — cân nhắc custom `areEqual` khi cần.
- **Đo trước khi tối ưu:** React DevTools Profiler cho biết component nào render nhiều; đừng memo theo cảm tính.

## Bảng so sánh Angular ↔ React
| Angular | React | Ghi chú |
|---|---|---|
| `{{ d \| date }}` | `{fmtDate.format(d)}` | Pipe built-in ↔ Intl function |
| `{{ v \| currency:"VND" }}` | `{fmtVND.format(v)}` | Tham số pipe ↔ option khi tạo instance |
| pure pipe (cache) | instance Intl ngoài component / `useMemo` | Cùng ý tưởng cache |
| pipe tùy biến (`@Pipe`) | hàm thuần (đặt trong `utils/`) | Cùng trách nhiệm, không cần decorator |
| `async` pipe | `use()` + Suspense / TanStack Query | Xem DAY 12-13 |
| `ChangeDetectionStrategy.OnPush` | `memo` / React Compiler | OnPush so reference, memo so props |
| `| number` với locale | `new Intl.NumberFormat(locale)` | Locale là tham số, không hardcode |
| `| percent` | `Intl.NumberFormat(..., { style: "percent" })` | Cùng API, nhiều style |
| `| json` (debug) | `JSON.stringify(data, null, 2)` trong `<pre>` | Không cần pipe |
| `| slice`/`| uppercase` | `.slice()`, `.toUpperCase()` trực tiếp | Chuỗi JS thuần |

## Lỗi thường gặp (Common pitfalls)
- **`useMemo(() => heavy(a, b), [a, b])` với deps không ổn định (tạo mỗi render)** → cache luôn miss, vừa tốn chi phí so sánh vừa tính lại. → Fix: ổn định nguồn dữ liệu, hoặc để Compiler lo.
- **Lạm dụng `memo` cho mọi component** → so props tốn CPU hơn re-render bé; đặc biệt component nhỏ không nhận props. → Fix: chỉ memo item list + component render thường; đo bằng React DevTools Profiler.
- **Tạo `Intl` instance mới trong render** → mất cache, chậm lại. → Fix: đưa ra module scope hoặc `useMemo` với deps rỗng.
- **Mutate mảng rồi `reduce` trong useMemo** — `rows.push(x)` giữ tham chiếu → deps không đổi → tổng stale. → Fix: dữ liệu bất biến `[...rows, x]`, deps đúng tham chiếu mới.
- **Nhầm `useMemo` là "chạy 1 lần"** — deps rỗng `[]` mới 1 lần; với deps khác chạy lại khi deps đổi (thường đúng ý bạn). → Fix: hiểu rõ deps = "khi nào cần tính lại".
- **Format số/ngày sai locale** khi app đa ngôn ngữ — dùng `Intl` với locale từ i18n (DAY 18), không hardcode "vi-VN".
- **Dùng `useMemo` cho tính toán rẻ** (cộng vài số) → chi phí so sánh deps lớn hơn lợi ích. → Fix: chỉ memo việc thật sự nặng.
- **`memo` component có children** → children tạo mới mỗi render làm memo vô hiệu. → Fix: cân nhắc hoặc để Compiler xử lý.
- **Quên `key` khi map sang `Row`** → memo/diff sai chỗ. → Fix: key ổn định (DAY 2).
- **Nối chuỗi tiền tệ thủ công** (`"$" + n.toFixed(2)`) → sai định dạng quốc tế. → Fix: luôn `Intl.NumberFormat`.

## Best practices / Mẹo
- **Với React 19.3 + Compiler 1.0:** viết code tự nhiên trước; chỉ thêm `useMemo` khi (a) đo được perf issue, (b) cần **tham chiếu ổn định** cho deps của `useEffect` (hàng hiếm), hoặc (c) component chưa được Compiler bao phủ.
- Gom format vào `utils/format.ts`: `vnd(n)`, `date(d)`, `bytes(n)...` — tái dùng, test dễ (DAY 21) — đúng tinh thần pure pipe.
- Số tiền/ngày dùng `Intl` với numbering system; đèn đỏ nếu bạn đang nối chuỗi `"$" + n`.
- Cho list lớn (hàng nghìn item), kết hợp `memo` + `key` đúng (DAY 2) + virtualization khi cần (xem `2_react-techniques/3_performance-optimization/2-virtualization`).
- **Ưu tiên `Intl` cho mọi định dạng**: số, tiền, ngày, phần trăm, đơn vị — nhất quán và đúng locale.
- Tạo instance `Intl` ở **module scope** hoặc một `Map` cache theo locale — tránh tạo lại mỗi render.
- Dùng `toLocaleString`/`toLocaleDateString` cho nhu cầu nhanh, `Intl.*Format` khi cần cấu hình chi tiết.
- Với React Compiler: bỏ phần lớn `useMemo`/`memo`; chỉ giữ khi cần **tham chiếu ổn định** cho deps effect hoặc API ngoài.

## Bài tập nhỏ
1. Thêm trạng thái `theme` vào `App` để bấm nút đổi — giữ `console.log` trong `Row`; bật/tắt `memo` và Compiler để quan sát số lần Row render thay đổi thế nào.
2. Viết helper `formatBytes(bytes)` bằng `Intl.NumberFormat` với unit byte/kilobyte... và hiển thị danh sách file; so sánh với phiên bản nối chuỗi thủ công (kiểm tra round-off số).
3. Viết `formatRelative(date)` dùng `Intl.RelativeTimeFormat` hiển thị "x phút trước" — tính delta giữa `Date.now()` và mốc.
4. Tạo `useMemo` tính trung bình của danh sách lớn và đo thời gian trước/sau khi thêm memo.
5. Đổi locale đang chọn sang `en-US` và quan sát định dạng tiền/ngày thay đổi (dùng `i18n.language` ở DAY 18).

## Reference
- https://react.dev/reference/react/useMemo
- https://react.dev/reference/react/memo
- https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl
- https://react.dev/learn/react-compiler