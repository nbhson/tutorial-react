# Chống Prop-Drilling

> Nguồn: https://react.dev/learn/passing-props-to-a-component — https://react.dev/reference/react/createContext

## Mục tiêu

### 1. Nhận diện và loại bỏ prop-drilling: truyền props qua 4–5 tầng trung gian không sử dụng

**Vì sao:** prop-drilling là khi data đi qua nhiều tầng chỉ để đến một component sâu — mỗi tầng giữa phải khai báo prop dù không dùng. Sửa tên prop phải sửa 5 chỗ, thêm một field phải đụng 5 file, cây component "bẩn" vì đầy props cầu nối. Dấu hiệu: grep tên prop thấy xuất hiện > 3 tầng, tầng giữa không đọc nó mà chỉ chuyển tiếp.

**Cơ chế nhận diện:** mở cây `App → Toolbar → Sidebar → Filters → SegmentPicker`, thấy `locale` và `activeSegment` đi qua cả 4 tầng mà Toolbar/Sidebar/Filters không dùng — đó là drill. Đo bằng Profiler: đổi `activeSegment` mà Toolbar cũng re-render (dù không dùng) là lãng phí theo chuỗi.

```tsx
// ❌ SAI: drill 3 tầng — tầng giữa chỉ chuyển tiếp, không dùng
function App() { const [t] = useState('dark'); return <A theme={t} />; }
function A({ theme }: any) { return <B theme={theme} />; } // A không dùng theme
function B({ theme }: any) { return <C theme={theme} />; } // B không dùng theme
function C({ theme }: any) { return <h1>{theme}</h1>; } // chỉ C dùng

// ✅ ĐÚNG: composition hoặc context — A, B không biết theme tồn tại (xem Ví dụ chi tiết)
```

**Usecase thực tế:** `SegmentPicker` cần `activeSegment` (đổi nhanh khi bấm) và `locale` (ít đổi). Drill cả hai qua 3 tầng khiến mỗi lần bấm đổi segment là cả Toolbar/Sidebar re-render. Quy tắc: 1–2 tầng drill là bình thường (rõ ràng, tường minh); 3 tầng cân nhắc composition; 4+ là tín hiệu context/store.

### 2. Ưu tiên đúng giải pháp theo đặc tính dữ liệu: composition → context → store

**Vì sao:** không phải mọi drill đều cần context/store. Composition (truyền component đã lắp sẵn) rẻ nhất, không cơ chế, React ưa thích. Context hợp data ít đổi nhiều nơi đọc (theme, locale, user). Store hợp state nóng nhiều writer (cart, filter). Chọn sai (nhét state gõ phím vào context chung) khiến cả app re-render mỗi phím — chữa drill mà sinh bệnh nặng hơn.

**Bảng quyết định:**

| Đặc tính data | Giải pháp | Vì sao |
|---|---|---|
| Lắp sẵn được từ trên, ít nơi dùng | Composition (`children`/slots) | Miễn phí, không API mới |
| Nhiều nơi đọc, ít đổi (theme, locale) | Context | Gần React gốc, không dependency |
| Đổi nóng, nhiều writer (cart, filter) | Zustand + selector | Re-render chọn lọc, có persist |

### 3. Giữ cây component phẳng hơn, tầng giữa không phải "đứng bên" cho props nhà người khác

**Vì sao:** tầng giữa mang props không thuộc về mình sẽ phình API, khó tái dùng (muốn dùng `Card` ở chỗ khác phải mang theo `theme` dù không cần), khó test (phải mock props cầu nối). Composition biến tầng giữa thành "ống vô tri" (`children`) — tái dùng ở đâu cũng được, test không cần biết data sâu.

## Tổng quan

Prop-drilling (khoan props) là khi data đi qua nhiều tầng chỉ để đến 1 component sâu — mỗi tầng trung gian phải khai báo props dù không dùng, sửa tên prop phải sửa 5 chỗ, và cây component ngày càng "bẩn". Giải pháp không phải lúc nào cũng là context/store: chuẩn 2026 là **thử theo thứ tự**:

1. **Composition** — không truyền data, truyền *component đã lắp sẵn* (`children`/slots). Rẻ nhất, không đổi API, React ưa thích. Ví dụ Page tự lắp `<Card><CardTitle/></Card>` rồi truyền xuống — Card không cần biết theme.
2. **Context** — dữ liệu ít đổi, nhiều nơi đọc (theme, locale, auth user). Provider ở trên, `useContext` ở nơi cần, tầng giữa vô hình.
3. **Store (Zustand)** — state đổi thường xuyên và nhiều nơi ghi thay đổi (cart, filters). Selector hẹp để chỉ ai cần mới vẽ lại.

Áp dụng khi thấy "props cầu nối" lặp lại, hoặc cây chìm 4+ tầng cho một mẩu dữ liệu. Giữ drill cho 1–2 tầng (rõ ràng hơn ẩn vào context), và đừng context hóa data chỉ dùng ở một nhánh.

## Khái niệm cốt lõi

### 1. Composition pattern — truyền thành phẩm, không truyền data thô

**Vì sao:** tầng giữa không cần biết data mà vẫn chuyển được UI. Page lắp sẵn `<CardTitle text=.../>` (đã gắn data) rồi nhét vào `<Card>` qua `children` — Card chỉ render `children`, không khai báo `theme`/`user` gì cả.

**Cơ chế:** `children: ReactNode` (hoặc slot `header`/`footer`/`renderItem`) là "khe cắm". Component cha quyết định nhét gì vào khe; component giữa không quan tâm nội dung khe là gì. Không cơ chế, không re-render thừa, không dependency.

```tsx
// ✅ ĐÚNG: Card không biết theme — Page lắp sẵn CardTitle rồi nhét vào
function Card({ children }: { children: React.ReactNode }) {
  return <section className="card">{children}</section>; // ống vô tri, tái dùng ở đâu cũng được
}
export function Page() {
  return <Card><CardTitle text="Xin chào" /></Card>; // data gắn ở Page, không qua Card
}
```

**Sai thì sao:**

```tsx
// ❌ SAI: Card mang prop cầu nối — muốn dùng Card ở chỗ khác phải mang theme theo
function Card({ theme, children }: any) { return <section data-theme={theme}>{children}</section>; }
// ✅ ĐÚNG: Card chỉ nhận children — theme do CardTitle đọc trực tiếp từ context
```

### 2. Context — `createContext` + Provider + `useContext`, mọi consumer re-render khi value đổi

**Vì sao:** context là "biến global có phạm vi" cho cây React. Hợp data ít đổi (theme, locale) vì re-render hiếm. Không hợp state nóng vì mỗi lần value đổi là mọi consumer vẽ lại — một context app-wide chứa 20 field thì đổi 1 field cũng vẽ lại cả app.

**Cơ chế:** `createContext(default)` tạo kênh; `<Provider value={...}>` phát; `useContext(Ctx)` đọc ở nơi cần. So sánh value bằng `Object.is` — object literal mới mỗi render (`value={{theme}}`) là reference mới → re-render dù giá trị không đổi. Fix bằng `useMemo` value hoặc tách provider.

```tsx
// ❌ SAI: value literal mới mỗi render — mọi consumer re-render dù theme không đổi
function App({ theme }: any) { return <Ctx.Provider value={{ theme }}>{children}</Ctx.Provider>; }
// ✅ ĐÚNG: memo value — reference ổn định
function App({ theme }: any) {
  const v = useMemo(() => ({ theme }), [theme]); // chỉ đổi khi theme đổi thật
  return <Ctx.Provider value={v}>{children}</Ctx.Provider>;
}
```

### 3. Zustand — selector-based, chỉ ai đọc lát đổi mới vẽ lại

**Vì sao:** state nóng (gõ phím, cart) đổi liên tục. Context vẽ lại cả cây; Zustand với `useStore(s => s.cart)` chỉ vẽ component đọc `cart`. Thêm `persist`/devtools sẵn, không cần Provider bọc.

```tsx
// ✅ ĐÚNG: đổi locale không vẽ lại nút đọc activeSegment
const active = useFilters((s) => s.active); // chỉ khi active đổi mới render
```

### 4. Mẹo Context splitting — tách theo domain, tách state/actions

Đừng một `AppCtx` chứa tất cả. Tách `ThemeCtx`, `AuthCtx`, `SettingsCtx` — consumer chỉ đọc cái mình cần. Nâng cao: tách provider thành "state" (hay đổi) và "actions" (ổn định tham chiếu) — consumer chỉ đọc actions không bao giờ bị vẽ thừa.

### 5. `useReducer` + Context — nửa đường giữa context và store

Domain state tầm trung (auth, cart vài action) chưa cần Zustand: context giữ `{ state, dispatch }`, consumer gọi `dispatch({ type })`. `dispatch` ổn định tham chiếu nên không gây render thừa như value object. Lớn hơn nữa (nhiều slice, persist) thì lên store.

## Luồng hoạt động / Cách áp dụng

### Bước 1. Phát hiện drill: grep props cùng tên > 3 tầng

Tìm prop xuất hiện ở 4+ component theo chuỗi cha-con mà tầng giữa không dùng. Ghi lại chuỗi đó — đó là ứng viên refactor.

### Bước 2. Hỏi "lắp sẵn được không?" → composition ngay

Nếu data chỉ cần ở một nhánh sâu, Page tự lắp component sâu rồi truyền qua `children`/slot. Không cần cơ chế mới, xong trong 5 phút.

### Bước 3. Nhiều nơi đọc + ít đổi → Context

Bọc Provider quanh vùng dùng (đặt gần nơi dùng nhất để giới hạn phạm vi re-render), consumer gọi `useX()`. Value memo, tách domain.

### Bước 4. Đổi nóng + nhiều writer → Zustand

Gom theo slice, selector hẹp, `useShallow` cho nhiều field. Đo Profiler trước/sau để chứng minh Toolbar/Sidebar không còn vẽ thừa.

### Bước 5. Đo bằng Profiler, giữ drill 1–2 tầng

Bấm đổi segment, xem Toolbar/Sidebar/Filters có bôi đỏ không. Không đỏ là đạt. Đừng xóa hết drill — drill ngắn là tường minh, dễ đọc hơn ẩn vào context.

## Ví dụ chi tiết

Mirror 1-1 với `example.tsx` cùng thư mục (không rút gọn):

```tsx
// example.tsx — mirror đầy đủ, khớp từng dòng với file thật
import { createContext, useContext, type ReactNode } from 'react';

// ---------- Context: theme dùng chung, ít đổi ----------
// Vì sao context: theme đọc ở nhiều nơi, hiếm khi đổi → re-render không đáng kể
type Theme = 'light' | 'dark';
const ThemeCtx = createContext<Theme>('light'); // default ngoài Provider — test lẻ không vỡ
export const useTheme = () => useContext(ThemeCtx); // hook tiện đọc — đặt cạnh context để dễ refactor

// ---------- Composition: tầng giữa không cần props ----------
// Card nhận children — không biết card có gì, không biết theme tồn tại
// Vì sao: Card là "ống vô tri" — tái dùng ở đâu cũng được, không mang prop cầu nối
function Card({ children }: { children: ReactNode }) {
  return <section className="card">{children}</section>;
}

// CardTitle đọc theme TRỰC TIẾP từ context — không qua trung gian Card
function CardTitle({ text }: { text: string }) {
  const theme = useTheme(); // không prop theme nào đi qua Card — drill biến mất
  return <h2 data-theme={theme}>{text}</h2>; // CSS [data-theme] styling theo theme
}

export function Page() {
  return (
    <ThemeCtx.Provider value="dark"> {/* cung cấp cho cả cây con — đặt đúng tầng cần, không quá cao */}
      <Card>
        {/* truyền "thành phẩm" xuống, không truyền data thô — composition */}
        <CardTitle text="Không cần truyền props qua Card" />
      </Card>
    </ThemeCtx.Provider>
  );
}
```

## Giải thích từng phần

### `createContext<Theme>('light')` — default cho ngoài Provider

Test lẻ `CardTitle` không bọc Provider vẫn có `'light'` để render, không crash `undefined`. Default không thay Provider thật — chỉ là lưới an toàn.

### `useTheme()` — shortcut cạnh context

Ít gõ hơn `useContext(ThemeCtx)`, import gọn, self-documenting. Muốn đổi sang store sau chỉ sửa một file hook, không sửa 20 nơi gọi.

### `Card({ children })` — tầng giữa vô hình với data

Card không khai báo `theme` prop nên API sạch, tái dùng ở trang không có theme cũng được. Đây là tinh thần composition: tầng giữa là khe cắm, không phải cầu nối.

### `data-theme={theme}` — context được UI tiêu thụ không cần class prop

CSS `[data-theme="dark"]` styling theo attribute. Không cần truyền `className` theme qua Card — theme đi đường context, class đi đường CSS.

### Provider đặt đúng tầng cần — giới hạn phạm vi re-render

Đặt ở App thì đổi theme vẽ lại cả app (chấp nhận được vì theme hiếm đổi). Đặt state nóng ở App thì thảm họa. Quy tắc: Provider càng gần nơi dùng càng tốt, miễn mọi consumer nằm trong.

## So sánh (nếu có)

### Composition vs Context vs Store

Composition miễn phí, không cơ chế — dùng khi lắp sẵn được. Context global-ish, value mới là cả cây consumer vẽ lại — dùng cho ít đổi. Store selector hẹp — dùng cho nóng/nhiều writer, giá là thêm dependency và khai báo slice. Bảng quyết định ở Mục tiêu là la bàn — đo Profiler khi phân vân.

### Context vs Zustand

Context gần React gốc, không dependency, hợp provider tree (theme, locale). Zustand hợp global mutable tần suất cao, kiểm soát re-render tốt hơn, có persist/devtools. Đừng dùng context cho cursor/game 60fps — qua store/`useSyncExternalStore`.

### Giữ drill ngắn vs context hóa mọi thứ

Context hóa mọi prop là "chuyển bệnh": mất infer props, khó biết ai đọc gì, refactor mù. Drill 1–2 tầng giữ tường minh: nhìn signature là biết component cần gì.

## Lỗi thường gặp / Chống chỉ định

### 1. Value là object literal → re-render mọi consumer mỗi lần provider vẽ

```tsx
// ❌ SAI: reference mới mỗi render
<Ctx.Provider value={{ theme, setTheme }}>
// ✅ ĐÚNG: memo hoặc tách provider
const v = useMemo(() => ({ theme, setTheme }), [theme, setTheme]);
<Ctx.Provider value={v}>
```

### 2. Một context app-wide cho mọi state → đổi 1 field vẽ cả app

Tách `ThemeCtx`/`AuthCtx`/`CartStore`. State nóng qua store selector. Đo Profiler để thấy vùng đỏ thu hẹp sau tách.

### 3. Context hóa mọi props cầu nối → mất scope

Bắt đầu bằng composition; context chỉ khi ≥ 3 nơi đọc xa nhau. Data một nhánh → truyền thẳng đơn giản hơn.

### 4. Provider sai tầng (quá cao lan rộng, quá thấp ngoài phạm vi)

Quá cao: value đổi vẽ cả app. Quá thấp: consumer ngoài báo null/default nhầm ("context flash"). Đặt gần nơi dùng nhất mà vẫn bao hết consumer.

### 5. Chống chỉ định: drill 1–2 tầng, data 60fps

Drill ngắn cứ để — over-engineering tốn hơn lợi. Data đổi theo mili-giây (cursor, game) không qua context thường — qua store/`useSyncExternalStore` với subscription tinh chỉnh.

## Câu hỏi thường gặp

### Bao nhiêu tầng thì gọi là drilling?

Thực dụng: 1–2 bình thường, 3 cân nhắc composition, 4+ tín hiệu context/store. Đếm theo chuỗi cha-con mà tầng giữa không dùng prop đó.

### Context có làm app chậm không?

Chỉ khi value đổi thường xuyên hoặc provider quá cao. Value ít đổi + phạm vi đúng thì không đáng kể — đừng tối ưu sớm, đo Profiler trước.

### Khi nào dùng store thay context?

State nóng (gõ, kéo, cart cập nhật liên tục) hoặc cần selector giới hạn render. Context cho provider tree tĩnh; store cho global mutable động.

### Có nên bỏ hết drill?

Không. Drill ngắn rõ ràng, tường minh, dễ đọc hơn ẩn vào context. Xóa drill dài, giữ drill ngắn.

### Context value là hàm có sao không?

Hàm mới mỗi render (`onClick={() => ...}` trong value) là reference mới → consumer vẽ thừa. Bọc `useCallback` hoặc tách actions provider (actions ổn định nên không gây vẽ thừa).

## Ghi chú 2026

- **React 19 render `<Context>` trực tiếp:** `<ThemeCtx value="dark">` thay `<ThemeCtx.Provider value="dark">` — gọn hơn, cùng ngữ nghĩa.
- **Zustand v5 + `useShallow` là "context cho state nóng":** phổ biến nhất hiện nay cho cart/filter, thay dần pattern context object lớn.
- **React Compiler tự memo children/provider value:** giảm bẫy object literal khi code tuân rules — nhưng vẫn nên memo tường minh cho value quan trọng.

## Best practices / Mẹo

### Rule cá nhân + composition đầu tay + hook cạnh context

"2 cấp drill bình thường; 3 composition; 4+ context/store." Composition (`children`, `header/footer`, `renderItem`) là vũ khí đầu tay — React khuyến khích, dễ đọc. Hook `useTheme()` cạnh `createContext` để import gọn.

### Profiler quyết định, không cảm tính; Provider gần nơi dùng; tách state/actions

Bôi đỏ Profiler cho biết ai vẽ thừa — sửa theo số. Provider gần nơi dùng nhất. Tách context state/actions để consumer actions không bị vẽ thừa. `useSyncExternalStore` cho store ngoài cần subscription tay.

### Hook con thay Context thô; tên slot rõ nghĩa; ghi lý do store trong PR

`useUser()` thay export Context thô để ép dùng đúng. Slot đặt tên rõ (`header`, `actions`). Ghi lý do chọn store thay context trong PR dựa trên số Profiler — người sau hiểu vì sao.

## Bài tập nhỏ

App cây `App → Toolbar → Sidebar → Filters → SegmentPicker`. `SegmentPicker` cần `activeSegment` (đổi nhanh) và `locale` (ít đổi), cả hai đang drill 3 tầng:

1. Đưa `activeSegment` vào Zustand `useFilters(s => s.active)` — selector hẹp, đổi segment chỉ SegmentPicker vẽ lại.
2. Đưa `locale` vào `LocaleCtx` ở App — Provider bọc cây, consumer đọc trực tiếp.
3. Xóa props cầu nối khỏi Toolbar/Sidebar/Filters — xác nhận API sạch.
4. Mở Profiler, bấm đổi segment: kiểm tra Toolbar/Sidebar/Filters **không** bôi đỏ. Liệt kê file sửa, file sạch, và số lần render trước/sau.

## Reference

- [Passing Props (React)](https://react.dev/learn/passing-props-to-a-component)
- [createContext](https://react.dev/reference/react/createContext)
- [Scaling Up with Reducer and Context](https://react.dev/learn/scaling-up-with-reducer-and-context)
- [Zustand — selectors](https://zustand.docs.pmnd.rs/guides/selectors)
