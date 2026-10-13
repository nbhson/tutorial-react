# DAY 10: MEMO & FORMAT (PIPE)

## Mục tiêu bài học
- Thay khái niệm Angular Pipe bằng tư duy "format là function": `Intl` API + hàm thuần + `useMemo`/Compiler để cache.
- Hiểu `memo` và `useMemo` hoạt động thế nào, và **vì sao React 19.3 + Compiler 1.0 khiến bạn hầu như không cần tự memo** — đo trước, memo sau.
- Biết `use()` + Suspense thay cho `async` pipe (gợi ý sang DAY 12-13).

## Khái niệm cốt lõi (Core)

### 1. Angular Pipe là cú pháp template — React pipe chỉ là function
`{{ total | currency:"VND" }}` trong Angular cần học pipe name + tham số + pure/impure. React không có pipe: `{fmtVND.format(total)}` — gọi hàm thuần ngay trong JSX vì JSX là JS. Muốn "giống pipe" thì gom helper `vnd(n)` trong `utils/format.ts`.

```tsx
// Angular: {{ total | currency:"VND":"symbol":"1.0-0":"vi" }}
// React: gọi hàm — không cú pháp mới, không decorator, test như hàm thường
const fmtVND = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" });
<p>Tổng: {fmtVND.format(total)}</p> // "254.000 ₫" — đúng locale Việt
// Gọn hơn: export const vnd = (n: number) => fmtVND.format(n); <p>{vnd(total)}</p>
```

Vì sao function thắng pipe? Vì pipe là DSL phải đăng ký (`@Pipe`, `declarations`), function là JS — import là dùng, test bằng `expect(vnd(120000)).toBe("120.000 ₫")` không cần TestBed. Hàm thuần còn tái dùng cho API/logic ngoài UI, pipe thì kẹt trong template.

### 2. `Intl` API là "pipe chuẩn" của modern JS
`Intl.NumberFormat` (số/tiền/phần trăm), `Intl.DateTimeFormat` (ngày), `Intl.RelativeTimeFormat` ("2 ngày trước") — built-in trình duyệt, đúng locale, cache instance ngoài component (tạo 1 lần, dùng mọi render).

```tsx
// example.tsx + README dùng 3 instance điển hình — tạo 1 lần ở module scope:
const fmtVND = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" });
const fmtDate = new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium" }); // "11 thg 10, 2026"
const fmtRelative = new Intl.RelativeTimeFormat("vi-VN", { numeric: "auto" });

fmtVND.format(120000); // "120.000 ₫" — nghìn phân cách chấm, ký hiệu ₫ sau
fmtDate.format(new Date()); // theo locale vi
fmtRelative.format(-2, "day"); // "2 ngày trước" — tự chia số ít/nhiều theo locale
```

Vì sao tạo ngoài component? Vì `new Intl.NumberFormat(...)` tốn (parse locale + options). Tạo trong render là mỗi render tốn một lần + mất cache nội bộ. Ngoài component = 1 lần duy nhất (giống pure pipe `pure: true`). Khi app đa ngôn ngữ (DAY 18), tạo Map cache theo locale hoặc `useMemo` theo `i18n.language` — không hardcode `"vi-VN"`.

### 3. `useMemo(fn, deps)` — cache kết quả tính nặng
Chỉ tính lại khi `deps` đổi. Không phải "tối ưu mọi thứ": cache tốn bộ nhớ giữ kết quả cũ + CPU so deps mỗi render. Tính cộng vài số mà `useMemo` là lỗ (so deps đắt hơn tính lại).

```tsx
// example.tsx: tổng 3 số — demo cơ chế (thật ra rẻ, không cần memo; giữ để học):
const rows = [120000, 45000, 89000];
const total = useMemo(() => rows.reduce((a, b) => a + b, 0), [rows]);
// rows không đổi tham chiếu qua render -> trả tổng cache, không reduce lại
// rows là mảng tham chiếu: nếu cha tạo [120000, ...] mới mỗi render thì deps luôn khác -> cache miss luôn
```

Kỷ luật deps: dữ liệu bất biến (`[...rows, x]` tạo mảng mới khi đổi, không `push`), deps là tham chiếu ổn định. Mutate `rows.push(x)` giữ tham chiếu → deps tưởng không đổi → tổng stale (sai). Hiểu `deps = "khi nào cần tính lại"`, `[]` = 1 lần (như lazy init).

### 4. `memo(Component)` — chặn re-render khi props không đổi
Mặc định React "cha render → **mọi con render theo**", kể cả con không đổi gì. `memo` bọc ngoài so props cũ/mới nông (`Object.is` từng field): giống hệt thì bỏ qua render, tái dùng kết quả cũ; khác thì render bình thường.

```tsx
// example.tsx: Row thường + MemoRow bọc — nội thất giữ nguyên, thêm "lính gác" ngoài
function Row({ text }: { text: string }) {
  console.log("Row render:", text); // bằng chứng: chỉ in khi thật sự render
  return <li>{text}</li>;
}
const MemoRow = memo(Row);
// App có input q: gõ phím nào App cũng render, nhưng MemoRow text không đổi -> memo chặn
<ul>{rows.map((r) => <MemoRow key={r} text={fmtVND.format(r)} />)}</ul>
```

Thử nghiệm trong example: gõ input → console KHÔNG thêm "Row render" (memo chặn). Xóa memo (dùng `Row` thường) → mỗi phím 3 dòng log. Với list 1000 dòng, đây là khác biệt giật vs mượt (khi chưa có Compiler). `memo` so nông: props object lồng (`style={{...}}` mới mỗi render) thì luôn khác → miss. Muốn so sâu thì custom `areEqual` thứ 2, nhưng hiếm cần.

### 5. React Compiler 1.0 — viết tự nhiên, Compiler memo thay
Bật mặc định ở nhiều setup Vite 2026: tự memo re-render + function/object. Bạn viết code DAY 1–9 tự nhiên (không `memo`/`useMemo`), Compiler tối ưu tương đương. Chỉ thêm tay khi (a) đo được issue (Profiler chỉ component render nhiều), (b) cần tham chiếu ổn định cho `useEffect` deps, (c) vùng Compiler chưa bao phủ.

```tsx
// Trước (tay): memo + useMemo khắp nơi
const Row = memo(({ text }: { text: string }) => <li>{text}</li>);
const total = useMemo(() => rows.reduce((a, b) => a + b, 0), [rows]);

// Sau (Compiler 1.0 bật): viết tự nhiên, Compiler tự memo hóa tương đương
function Row({ text }: { text: string }) { return <li>{text}</li>; }
const total = rows.reduce((a, b) => a + b, 0);
// Render ít như bản memo, code đọc như không tối ưu — tốt nhất hai thế giới
```

Vì sao "đo trước memo sau"? Vì memo sai tốn hơn không memo (so props 1000 component mỗi render đắt hơn vẽ lại 3 dòng). Profiler (React DevTools) cho biết ai render nhiều — memo đúng chỗ đó.

### Keyword chính
`Intl` + `NumberFormat`/`DateTimeFormat`/`RelativeTimeFormat` (pipe chuẩn), `pure function` (format helper), `useMemo` (cache giá trị), `memo` (chặn component render), React Compiler 1.0 (tự memo), `async pipe` → `use()`/Suspense (DAY 12-13).

## Luồng hoạt động (Flow)
1. Module load: tạo 1 instance `fmtVND` (vi-VN, VND) ngoài component — tái dùng mọi render, không tạo lại. Tương tự `fmtDate`/`fmtRelative` khi cần.
2. `App` render lần đầu: `rows = [120000, 45000, 89000]` (mảng mới mỗi render trong demo — chú ý deps), `useMemo(() => reduce, [rows])` tính tổng 254000; `rows.map` tạo 3 `<MemoRow text={fmtVND.format(r)} />`; console in 3 dòng "Row render".
3. Hiển thị: mỗi dòng tiền format `"120.000 ₫"` đúng locale; tổng `"254.000 ₫"`.
4. Gõ "a" vào input → `setQ("a")` → `App` re-render. `rows` tạo lại (tham chiếu mới) nên `useMemo` tính lại (demo nhỏ không sao); `MemoRow` nhận `text` cùng chuỗi → `memo` so `Object.is` từng prop → giống → **bỏ qua render** (console không thêm).
5. Đổi locale (DAY 18) → tạo instance `Intl` mới cho locale đó (hoặc `useMemo` theo locale) → chuỗi format đổi (dấu `.` thành `,`), không logic thủ công.
6. Thêm state `theme` ở App mà không đụng `text`: bấm đổi theme → App render, `memo` chặn Row (text giống) — `console.log` trong Row không chạy. Bỏ `memo` để so sánh: mọi Row render dù text giống — thấy ngay giá trị khi chưa Compiler.
7. Bật Compiler: gỡ `memo`/`useMemo`, chạy lại — số render vẫn thấp (Compiler tự chặn tương đương). Đây là tinh thần "viết tự nhiên, để Compiler lo".
8. Nếu `rows` từ props/state ổn định tham chiếu (không tạo mới mỗi render), `useMemo` mới có ý nghĩa cache; tạo mới mỗi render thì cache miss luôn — phải ổn định nguồn trước.

## Ví dụ chi tiết
Khớp 1-1 với `example.tsx` cùng thư mục (KHÔNG sửa example DAY 10 — đã chuẩn):

```tsx
// example.tsx — DAY 10: memo bọc component + format
import { memo, useMemo, useState } from "react";

// Instance Intl tạo 1 lần ở module scope — giống pure pipe cache sẵn
const fmtVND = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" });

// 1. Component thường — viết như mọi khi, không biết gì về memo
function Row({ text }: { text: string }) {
  console.log("Row render:", text); // bằng chứng: chỉ in khi thật sự render lại
  return <li>{text}</li>;
}

// 2. Bọc ngoài bằng memo — thêm "lính gác" so props, nội thất giữ nguyên
const MemoRow = memo(Row);

export default function App() {
  const [q, setQ] = useState(""); // gõ phím nào App cũng render lại
  const rows = [120000, 45000, 89000];
  const total = useMemo(() => rows.reduce((a, b) => a + b, 0), [rows]);
  return (
    <>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Gõ để App render lại" />
      <ul>{rows.map((r) => <MemoRow key={r} text={fmtVND.format(r)} />)}</ul>
      <p>Tổng: {fmtVND.format(total)}</p>
    </>
  );
}
// Thử nghiệm: gõ vào ô input — App render lại nhưng console KHÔNG in thêm
// "Row render" (text không đổi nên memo chặn). Xóa memo (dùng Row thường)
// rồi gõ lại — console in 3 dòng mỗi phím, thấy ngay tác dụng của lớp bọc.
```

Các "pipe" ngày/tương đối (giữ từ bản cũ):

```tsx
const fmtDate = new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium" });
const fmtRelative = new Intl.RelativeTimeFormat("vi-VN", { numeric: "auto" });

fmtDate.format(new Date());     // "11 thg 10, 2026" — đúng locale, không nối chuỗi tay
fmtRelative.format(-2, "day");  // "2 ngày trước" — tự số ít/nhiều
```

React Compiler: cùng component, không cần memo tay:

```tsx
// Trước: tự tối ưu bằng memo + useMemo
const Row = memo(({ text }: { text: string }) => <li>{text}</li>);
const total = useMemo(() => rows.reduce((a, b) => a + b, 0), [rows]);

// Sau (Compiler 1.0 bật): viết tự nhiên, Compiler tự memo hóa tương đương
function Row({ text }: { text: string }) { return <li>{text}</li>; }
const total = rows.reduce((a, b) => a + b, 0);
```

Gom format vào module dùng chung (`src/utils/format.ts` — tái dùng, dễ test như pure pipe):

```ts
const vnd = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" });
const date = new Intl.DateTimeFormat("vi-VN", { dateStyle: "short" });

export const fmtVND = (n: number) => vnd.format(n); // test: expect(fmtVND(120000)).toBe("120.000 ₫")
export const fmtDate = (d: Date) => date.format(d);
```

## Giải thích từng phần
- Dòng `new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" })`: "pipe currency" — luôn `"120.000 ₫"` kiểu Việt (chấm nghìn, ₫ sau). Đặt ngoài component = không tạo mới mỗi render (giống pure pipe `pure: true`). Tham số thứ 2 là options (thay tham số pipe `currency:"VND"`).
- Dòng `fmtVND.format(r)` trong `map`: gọi function trong JSX — không cần `|`. Muốn "giống pipe" thì helper `vnd(r)`. Format là thuần (cùng input → cùng output), không side effect, dễ mock/test.
- Dòng `function Row({ text })` + `console.log`: component thường không biết memo — log là bằng chứng render. Vì sao log trong render? Vì render là hàm thuần được gọi mỗi lần vẽ — log cho thấy memo có chặn không. Nhớ xóa log ở prod.
- Dòng `const MemoRow = memo(Row)`: so props cũ/mới nông (`Object.is` từng key). `text` là string nên so nhanh, đúng. List dài + cha render thường (input search) thì tiết kiệm lớn. Component nhỏ không props thì `memo` vô ích (so tốn hơn vẽ).
- **`memo` "chặn render lại":** mặc định React render kiểu "cha render → **mọi con render theo**", kể cả con không đổi gì. `memo` là lớp bọc chặn cái đó:

```tsx
const Row = memo(function Row({ text }: { text: string }) {
  return <li>{text}</li>;
});
```

Cơ chế: mỗi khi cha render lại, thay vì render `Row` ngay, React **so props cũ vs mới** (so nông từng field bằng `Object.is`):
  - Props giống hệt → **bỏ qua render**, tái dùng kết quả lần trước.
  - Props khác → render lại bình thường.
Ví dụ: `App` có ô tìm kiếm, gõ phím nào cha cũng render. List 1000 `Row` bọc `memo` mà `text` không đổi → 1000 dòng đứng yên, chỉ ô input render — đó là "chặn render lại".
- Dòng `useMemo(() => rows.reduce(...), [rows])`: `rows` là tham chiếu — tạo mới mỗi render (như demo `const rows = [...]` trong body) thì deps luôn khác → cache miss luôn, vừa so vừa tính lại. Kỷ luật: nguồn ổn định (props/state/memo) + bất biến (không `push`). Demo giữ để học cơ chế; prod tính rẻ này bỏ memo cũng được (Compiler lo).
- Dòng `rows.map((r) => <MemoRow key={r} text={...} />)`: `key={r}` ổn định vì giá trị unique (120000 ≠ 45000). Nếu giá trị trùng thì key trùng → diff sai — phải key theo id. `key` đúng là điều kiện để memo/diff đúng (DAY 2).
- Dòng `<input value={q} onChange={...}>`: controlled để "ép" App render mỗi phím — tạo điều kiện demo memo. Không có input này thì App không render lại, không thấy memo chặn.
- Quy tắc **`Intl` theo locale**: đa ngôn ngữ thì `new Intl.NumberFormat(i18n.language, ...)` (DAY 18), không hardcode `"vi-VN"`. Nối `"$" + n.toFixed(2)` là sai quốc tế (sai dấu, sai vị trí ký hiệu).
- Quy tắc **đo trước tối ưu**: DevTools Profiler ghi ai render bao nhiêu lần, tốn bao lâu. Chỉ memo component Profiler chỉ đỏ. Memo theo cảm tính ("memo hết cho chắc") thường chậm hơn.

## Bảng so sánh Angular ↔ React
| Angular | React | Ghi chú |
|---|---|---|
| `{{ d \| date }}` | `{fmtDate.format(d)}` | Pipe built-in ↔ Intl function, không cú pháp `\|` |
| `{{ v \| currency:"VND" }}` | `{fmtVND.format(v)}` | Tham số pipe ↔ options khi tạo instance Intl |
| pure pipe (cache theo input) | instance Intl ngoài component / `useMemo` theo deps | Cùng ý cache, khác cơ chế |
| pipe tùy biến (`@Pipe` + declarations) | hàm thuần trong `utils/format.ts` | Không decorator/module, import là dùng |
| `async` pipe (subscribe/unsubscribe) | `use()` + Suspense / TanStack Query (DAY 12-13) | Đọc promise trực tiếp, không subscribe tay |
| `ChangeDetectionStrategy.OnPush` | `memo` / React Compiler | Cùng mục đích "đừng vẽ khi không đổi", khác cơ chế (chi tiết dưới) |
| `\| number` với locale | `new Intl.NumberFormat(locale)` | Locale là tham số tạo instance |
| `\| percent` | `Intl.NumberFormat(..., { style: "percent" })` | Cùng API Intl, đổi style |
| `\| json` (debug) | `JSON.stringify(data, null, 2)` trong `<pre>` | Không cần pipe, JS thuần |
| `\| slice`/`\| uppercase` | `.slice()`, `.toUpperCase()` trực tiếp trong `{}` | Chuỗi JS thuần, không pipe |

`memo` vs `OnPush` — cùng mục đích, khác cơ chế:

| Điểm | Angular `OnPush` | React `memo` |
|---|---|---|
| Kích hoạt check | Chỉ khi: `@Input` đổi tham chiếu, event trong component, `async` pipe emit, `markForCheck()` tay | Cha render → so props cũ/mới nông, giống thì bỏ qua |
| So sánh | So tham chiếu `@Input` (không so sâu) | So nông từng prop (`Object.is` mỗi field) |
| Phạm vi | Chiến lược cả component + subtree (con OnPush cũng ít bị check ké) | Chỉ 1 component bọc; con của nó vẫn render theo nếu nó render |
| Ép cập nhật | `ChangeDetectorRef.markForCheck()` / `detectChanges()` | `setState` bên trong, context đổi — tự render, không cần gọi gì |
| Mặc định | Opt-in từng component (`changeDetection: OnPush`) | Opt-in từng component (`memo(...)`) — React Compiler 2026 còn tự làm thay |

**Bẫy chung cả hai:** mutate object thay vì tạo mới → tham chiếu không đổi → cả hai tưởng "không đổi" → UI đơ. Cả 2 hệ đều bắt **immutable update** (`[...arr, x]`, `{...obj, k: v}`).

## Lỗi thường gặp (Common pitfalls)

### 1. `useMemo` với deps tạo mới mỗi render → cache miss luôn
```tsx
// ❌ SAI: rows tạo mới mỗi render -> deps luôn khác -> vừa so vừa tính lại, tốn đôi
function App() {
  const rows = [120000, 45000, 89000]; // mới mỗi render
  const total = useMemo(() => rows.reduce((a, b) => a + b, 0), [rows]);
}
```
```tsx
// ✅ ĐÚNG: nguồn ổn định (state/props/memo) + bất biến, hoặc bỏ memo khi rẻ (Compiler lo)
const [rows] = useState([120000, 45000, 89000]);
const total = useMemo(() => rows.reduce((a, b) => a + b, 0), [rows]);
// Hoặc rẻ thì: const total = rows.reduce((a, b) => a + b, 0); // Compiler memo giúp
```

### 2. Lạm dụng `memo` cho mọi component
```tsx
// ❌ SAI: component nhỏ không props mà memo — so tốn hơn vẽ
const Dot = memo(() => <span>•</span>);
```
```tsx
// ✅ ĐÚNG: chỉ memo item list + component render thường + Profiler chỉ đỏ
const Row = memo(function Row({ text }: { text: string }) { return <li>{text}</li>; });
```

### 3. Tạo `Intl` mới trong render
```tsx
// ❌ SAI: mỗi render tốn parse locale + mất cache
function App({ total }: { total: number }) {
  const fmt = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" });
  return <p>{fmt.format(total)}</p>;
}
```
```tsx
// ✅ ĐÚNG: ngoài module (hoặc memo theo locale)
const fmtVND = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" });
function App({ total }: { total: number }) { return <p>{fmtVND.format(total)}</p>; }
```

### 4. Mutate rồi `useMemo` → stale
```tsx
// ❌ SAI: push giữ tham chiếu -> deps tưởng không đổi -> tổng cũ
rows.push(1000); // mutate state trực tiếp
const total = useMemo(() => rows.reduce((a, b) => a + b, 0), [rows]); // stale
```
```tsx
// ✅ ĐÚNG: bất biến -> tham chiếu mới -> deps đổi -> tính lại
setRows((r) => [...r, 1000]);
```

### 5. Nhầm `useMemo` là "chạy 1 lần"
Mô tả: `useMemo(fn, [a, b])` chạy lại khi `a`/`b` đổi (đúng ý "khi nào cần tính lại"). Muốn 1 lần thì `[]`, nhưng 1 lần mà dùng biến đổi theo thời gian là stale. Hiểu deps thay vì mong "chạy 1 lần".

### 6. `memo` với `children` mới mỗi render → miss
```tsx
// ❌ SAI: children element mới mỗi render -> memo vô hiệu
<MemoCard><p>Hi {name}</p></MemoCard> // children mới mỗi lần App render
```
```tsx
// ✅ ĐÚNG: chấp nhận (Compiler xử lý) hoặc tách children ổn định ra ngoài
// Có Compiler: cứ viết tự nhiên. Chưa có: <MemoCard title="Hi" /> với title string ổn định
```

### 7. Nối chuỗi tiền tệ tay
```tsx
// ❌ SAI: sai locale (dấu, vị trí ₫/$), sai round
<p>{"$" + n.toFixed(2)}</p>
```
```tsx
// ✅ ĐÚNG: Intl đúng mọi locale
<p>{new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n)}</p>
```

## Best practices / Mẹo
- **Với Compiler 1.0:** viết tự nhiên trước; chỉ `useMemo` khi (a) Profiler chỉ issue, (b) cần tham chiếu ổn định cho `useEffect` deps, (c) vùng Compiler chưa phủ. Vì sao? Vì memo tay sai đắt hơn không memo.
- Gom format vào `utils/format.ts` (`vnd(n)`, `date(d)`) — tái dùng, test như hàm thuần (DAY 21). Vì sao? Vì format là logic thuần, không thuộc component nào.
- List lớn: `memo` + `key` đúng (DAY 2) + virtualization khi nghìn item. Vì sao thứ tự? Vì key sai thì memo/virtualize cũng sai.
- Tạo instance `Intl` ở module scope hoặc `Map` cache theo locale — không tạo trong render. Vì sao? Vì tạo Intl tốn, cache nội bộ mất khi tạo mới.
- `toLocaleString`/`toLocaleDateString` cho nhanh, `Intl.*Format` khi cần options chi tiết. Vì sao 2 mức? Vì 80% chỉ cần `n.toLocaleString("vi-VN")`, 20% tiền/ngày chuẩn mới cần instance cấu hình.

## Bài tập nhỏ
1. Thêm state `theme` vào `App`, bấm đổi — giữ `console.log` trong `Row`; bật/tắt `memo` và Compiler, ghi số lần Row render mỗi trường hợp. Vì sao Compiler gỡ memo vẫn ít render?
2. Viết `formatBytes(bytes)` bằng `Intl.NumberFormat` unit byte/kilobyte, hiện danh sách file; so sánh round-off với nối chuỗi tay.
3. Viết `formatRelative(date)` bằng `Intl.RelativeTimeFormat` ("x phút trước") từ delta `Date.now() - mốc`. Xử lý số ít/nhiều thế nào mà không `if` tay?
4. Tạo `useMemo` trung bình danh sách lớn, đo thời gian trước/sau memo bằng `performance.now()`. Khi nào chênh lệch đáng kể?
5. Đổi locale sang `en-US` (dùng `i18n.language` DAY 18) và quan sát tiền/ngày đổi dấu/vị trí. Vì sao hardcode `"vi-VN"` vỡ ở đây?

## Reference
- https://react.dev/reference/react/useMemo
- https://react.dev/reference/react/memo
- https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl
- https://react.dev/learn/react-compiler
