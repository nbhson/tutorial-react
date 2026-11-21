# Chống Prop-Drilling

> Nguồn: https://react.dev/learn/passing-props-to-a-component — https://react.dev/reference/react/createContext

## Mục tiêu

Mục này nói về ba đích của bài: nhận diện prop-drilling, chọn đúng giải pháp theo thứ tự composition → context → store, và giữ cây component sạch. Đọc để thấy bài giải bài toán "props cầu nối" thế nào.

### 1. Nhận diện và loại bỏ prop-drilling: truyền props qua 4–5 tầng trung gian không sử dụng

**Vì sao:** prop-drilling là khi data đi qua nhiều tầng chỉ để đến một component sâu — mỗi tầng giữa phải khai báo prop dù không dùng. Sửa tên prop phải sửa 5 chỗ, thêm một field phải đụng 5 file, cây component "bẩn" vì đầy props cầu nối. Dấu hiệu: grep tên prop thấy xuất hiện > 3 tầng, tầng giữa không đọc nó mà chỉ chuyển tiếp.

**Cơ chế nhận diện:** mở cây `App → Toolbar → Sidebar → Filters → SegmentPicker`, thấy `locale` và `activeSegment` đi qua cả 4 tầng mà Toolbar/Sidebar/Filters không dùng — đó là drill. Đo bằng Profiler: đổi `activeSegment` mà Toolbar cũng re-render (dù không dùng) là lãng phí theo chuỗi.

> 📄 **Code ví dụ:** [`examples/01-1-nhan-dien-va-loai-bo-prop-drilling.tsx`](examples/01-1-nhan-dien-va-loai-bo-prop-drilling.tsx)

**Usecase thực tế:** `SegmentPicker` cần `activeSegment` (đổi nhanh khi bấm) và `locale` (ít đổi). Drill cả hai qua 3 tầng khiến mỗi lần bấm đổi segment là cả Toolbar/Sidebar re-render. Quy tắc: 1–2 tầng drill là bình thường (rõ ràng, tường minh); 3 tầng cân nhắc composition; 4+ là tín hiệu context/store.

### 2. Ưu tiên đúng giải pháp theo đặc tính dữ liệu: composition → context → store

**Vì sao:** không phải mọi drill đều cần context/store. Composition (truyền component đã lắp sẵn) rẻ nhất, không cơ chế, React ưa thích. Context hợp data ít đổi nhiều nơi đọc (theme, locale, user). Store hợp state nóng nhiều writer (cart, filter). Chọn sai (nhét state gõ phím vào context chung) khiến cả app re-render mỗi phím — chữa drill mà sinh bệnh nặng hơn.

**Bảng quyết định:**

| Đặc tính data | Giải pháp | Vì sao |
|---|---|---|
| Lắp sẵn được từ trên, ít nơi dùng | Composition (`children`/slots) | Miễn phí, không API mới |
| Nhiều nơi đọc, ít đổi (theme, locale) | Context | Gần React gốc, không dependency |
| Đổi nóng, nhiều writer (cart, filter) | Zustand + selector | Re-render chọn lọc, có persist |

> **Cách đọc bảng này:** cột "Đặc tính data" mô tả tình huống bạn đang gặp, cột "Giải pháp" là đáp án nên thử theo đúng thứ tự từ trên xuống — rẻ nhất (composition) trước, tốn chi phí nhất (store) sau; cột "Vì sao" là lý do ngắn để nhớ.

### 3. Giữ cây component phẳng hơn, tầng giữa không phải "đứng bên" cho props nhà người khác

**Vì sao:** tầng giữa mang props không thuộc về mình sẽ phình API, khó tái dùng (muốn dùng `Card` ở chỗ khác phải mang theo `theme` dù không cần), khó test (phải mock props cầu nối). Composition biến tầng giữa thành "ống vô tri" (`children`) — tái dùng ở đâu cũng được, test không cần biết data sâu. Ví von: tầng giữa như người đưa thư chỉ cần đúng địa chỉ trên phong bì, không cần (không được) đọc thư hộ người nhận.

> **Tóm gọn 1 câu:** Ba mục tiêu: nhận diện drill qua số tầng, chọn giải pháp theo thang composition → context → store, và tầng giữa khỏi mang đồ nhà người khác.

## Tổng quan

Mục này nói về bức tranh lớn: prop-drilling là gì và chuẩn 2026 xử lý theo thứ tự nào. Đọc để có khung quyết định trước khi đi sâu từng giải pháp.

Prop-drilling (khoan props) là khi data đi qua nhiều tầng chỉ để đến 1 component sâu — mỗi tầng trung gian phải khai báo props dù không dùng, sửa tên prop phải sửa 5 chỗ, và cây component ngày càng "bẩn". Giải pháp không phải lúc nào cũng là context/store: chuẩn 2026 là **thử theo thứ tự**:

1. **Composition** — không truyền data, truyền *component đã lắp sẵn* (`children`/slots). Rẻ nhất, không đổi API, React ưa thích. Ví dụ Page tự lắp `<Card><CardTitle/></Card>` rồi truyền xuống — Card không cần biết theme.
2. **Context** — dữ liệu ít đổi, nhiều nơi đọc (theme, locale, auth user). Provider ở trên, `useContext` ở nơi cần, tầng giữa vô hình.
3. **Store (Zustand)** — state đổi thường xuyên và nhiều nơi ghi thay đổi (cart, filters). Selector hẹp để chỉ ai cần mới vẽ lại.

Áp dụng khi thấy "props cầu nối" lặp lại, hoặc cây chìm 4+ tầng cho một mẩu dữ liệu. Giữ drill cho 1–2 tầng (rõ ràng hơn ẩn vào context), và đừng context hóa data chỉ dùng ở một nhánh.

> **Tóm gọn 1 câu:** Thử theo thang giá: composition (miễn phí) → context (ít đổi) → store (đổi nóng) — và drill 1–2 tầng thì cứ để nguyên cho tường minh.

## Khái niệm cốt lõi

Mục này nói về 5 khái niệm của ba giải pháp chống drill — đọc để hiểu cơ chế từng cái trước khi chọn.

### 1. Composition pattern — truyền thành phẩm, không truyền data thô

**Vì sao:** tầng giữa không cần biết data mà vẫn chuyển được UI. Page lắp sẵn `<CardTitle text=.../>` (đã gắn data) rồi nhét vào `<Card>` qua `children` — Card chỉ render `children`, không khai báo `theme`/`user` gì cả.

**Cơ chế:** `children: ReactNode` (hoặc slot `header`/`footer`/`renderItem`) là "khe cắm". Component cha quyết định nhét gì vào khe; component giữa không quan tâm nội dung khe là gì. Ví von: `children` là ổ cắm điện trên tường — ổ không cần biết bạn cắm quạt hay đèn, chỉ cần cắm vừa là chạy. Không cơ chế, không re-render thừa, không dependency.

> 📄 **Code ví dụ:** [`examples/02-1-composition-pattern-truyen-thanh-pham-khong-truyen.tsx`](examples/02-1-composition-pattern-truyen-thanh-pham-khong-truyen.tsx)

**Sai thì sao:**

> 📄 **Code ví dụ:** [`examples/03-1-composition-pattern-truyen-thanh-pham-khong-truyen.tsx`](examples/03-1-composition-pattern-truyen-thanh-pham-khong-truyen.tsx)

### 2. Context — `createContext` + Provider + `useContext`, mọi consumer re-render khi value đổi

**Vì sao:** context là "biến global có phạm vi" cho cây React. Hợp data ít đổi (theme, locale) vì re-render hiếm. Không hợp state nóng vì mỗi lần value đổi là mọi consumer vẽ lại — một context app-wide chứa 20 field thì đổi 1 field cũng vẽ lại cả app.

**Cơ chế:** `createContext(default)` tạo kênh; `<Provider value={...}>` phát; `useContext(Ctx)` đọc ở nơi cần. So sánh value bằng `Object.is` — object literal mới mỗi render (`value={{theme}}`) là reference mới → re-render dù giá trị không đổi. Fix bằng `useMemo` value hoặc tách provider.

> 📄 **Code ví dụ:** [`examples/04-2-context-createcontext-provider-usecontext-moi-consumer-re.tsx`](examples/04-2-context-createcontext-provider-usecontext-moi-consumer-re.tsx)

### 3. Zustand — selector-based, chỉ ai đọc lát đổi mới vẽ lại

**Vì sao:** state nóng (gõ phím, cart) đổi liên tục. Context vẽ lại cả cây; Zustand với `useStore(s => s.cart)` chỉ vẽ component đọc `cart`. Thêm `persist`/devtools sẵn, không cần Provider bọc.

> 📄 **Code ví dụ:** [`examples/05-3-zustand-selector-based-chi-ai-oc-lat.tsx`](examples/05-3-zustand-selector-based-chi-ai-oc-lat.tsx)

### 4. Mẹo Context splitting — tách theo domain, tách state/actions

Đừng một `AppCtx` chứa tất cả. Tách `ThemeCtx`, `AuthCtx`, `SettingsCtx` — consumer chỉ đọc cái mình cần. Nâng cao: tách provider thành "state" (hay đổi) và "actions" (ổn định tham chiếu) — consumer chỉ đọc actions không bao giờ bị vẽ thừa.

### 5. `useReducer` + Context — nửa đường giữa context và store

Domain state tầm trung (auth, cart vài action) chưa cần Zustand: context giữ `{ state, dispatch }`, consumer gọi `dispatch({ type })`. `dispatch` ổn định tham chiếu nên không gây render thừa như value object. Lớn hơn nữa (nhiều slice, persist) thì lên store.

> **Tóm gọn 1 câu:** Composition truyền thành phẩm qua khe cắm, context là loa phát cho cả vùng nghe, Zustand là radio cá nhân chọn kênh — tách context theo domain để đỡ lan âm thanh.

## Luồng hoạt động / Cách áp dụng

Mục này nói về 5 bước xử lý một drill thực tế: từ phát hiện đến đo kiểm chứng. Đọc để có quy trình làm việc cụ thể.

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

> **Tóm gọn 1 câu:** Grep phát hiện → composition trước → context khi nhiều nơi ít đổi → store khi đổi nóng → Profiler chấm bài và giữ drill ngắn.

## Ví dụ chi tiết

Mục này nói về code hoàn chỉnh mirror 1-1 với file gốc. Đọc để thấy ba giải pháp cùng sống trong một cây component thật.

Mirror 1-1 với `example.tsx` cùng thư mục (không rút gọn):

> 📄 **Code ví dụ:** [`examples/06-vi-du-chi-tiet.tsx`](examples/06-vi-du-chi-tiet.tsx)

## Giải thích từng phần

Mục này nói về từng chi tiết trong ví dụ — những chỗ nhỏ quyết định pattern chạy đúng hay re-render thừa.

### `createContext<Theme>('light')` — default cho ngoài Provider

Test lẻ `CardTitle` không bọc Provider vẫn có `'light'` để render, không crash `undefined`. Default không thay Provider thật — chỉ là lưới an toàn.

### `useTheme()` — shortcut cạnh context

Ít gõ hơn `useContext(ThemeCtx)`, import gọn, self-documenting. Muốn đổi sang store sau chỉ sửa một file hook, không sửa 20 nơi gọi.

### `Card({ children })` — tầng giữa vô hình với data

Card không khai báo `theme` prop nên API sạch, tái dùng ở trang không có theme cũng được. Đây là tinh thần composition: tầng giữa là khe cắm, không phải cầu nối.

### `data-theme={theme}` — context được UI tiêu thụ không cần class prop

CSS `[data-theme="dark"]` styling theo attribute. Không cần truyền `className` theme qua Card — theme đi đường context, class đi đường CSS.

### Provider đặt đúng tầng cần — giới hạn phạm vi re-render

Đặt ở App thì đổi theme vẽ lại cả app (chấp nhận được vì theme hiếm đổi). Đặt state nóng ở App thì thảm họa. Quy tắc: Provider càng gần nơi dùng càng tốt, miễn mọi consumer nằm trong — như đặt loa phát thanh trong đúng khu cần nghe, không mở loa cho cả thành phố.

## So sánh (nếu có)

Mục này nói về ba cặp so sánh quyết định chọn gì: composition/context/store, context/Zustand, giữ drill ngắn/context hóa. Đọc để có la bàn quyết định.

### Composition vs Context vs Store

Composition miễn phí, không cơ chế — dùng khi lắp sẵn được. Context global-ish, value mới là cả cây consumer vẽ lại — dùng cho ít đổi. Store selector hẹp — dùng cho nóng/nhiều writer, giá là thêm dependency và khai báo slice. Bảng quyết định ở Mục tiêu là la bàn — đo Profiler khi phân vân.

### Context vs Zustand

Context gần React gốc, không dependency, hợp provider tree (theme, locale). Zustand hợp global mutable tần suất cao, kiểm soát re-render tốt hơn, có persist/devtools. Đừng dùng context cho cursor/game 60fps — qua store/`useSyncExternalStore`.

### Giữ drill ngắn vs context hóa mọi thứ

Context hóa mọi prop là "chuyển bệnh": mất infer props, khó biết ai đọc gì, refactor mù. Drill 1–2 tầng giữ tường minh: nhìn signature là biết component cần gì.

> **Tóm gọn 1 câu:** Không có giải pháp nào thắng mọi trận — composition rẻ, context cho ít đổi, store cho nóng, và drill ngắn vẫn đáng giữ.

## Lỗi thường gặp / Chống chỉ định

Mục này nói về 5 bẫy khi chống prop-drilling — đặc biệt là "chữa drill bằng cách sinh bệnh re-render". Đọc để không chữa lửa bằng xăng.

### 1. Value là object literal → re-render mọi consumer mỗi lần provider vẽ

> 📄 **Code ví dụ:** [`examples/07-1-value-la-object-literal-re-render-moi.tsx`](examples/07-1-value-la-object-literal-re-render-moi.tsx)

### 2. Một context app-wide cho mọi state → đổi 1 field vẽ cả app

Tách `ThemeCtx`/`AuthCtx`/`CartStore`. State nóng qua store selector. Đo Profiler để thấy vùng đỏ thu hẹp sau tách.

### 3. Context hóa mọi props cầu nối → mất scope

Bắt đầu bằng composition; context chỉ khi ≥ 3 nơi đọc xa nhau. Data một nhánh → truyền thẳng đơn giản hơn.

### 4. Provider sai tầng (quá cao lan rộng, quá thấp ngoài phạm vi)

Quá cao: value đổi vẽ cả app. Quá thấp: consumer ngoài báo null/default nhầm ("context flash"). Đặt gần nơi dùng nhất mà vẫn bao hết consumer.

### 5. Chống chỉ định: drill 1–2 tầng, data 60fps

Drill ngắn cứ để — over-engineering tốn hơn lợi. Data đổi theo mili-giây (cursor, game) không qua context thường — qua store/`useSyncExternalStore` với subscription tinh chỉnh.

> **Tóm gọn 1 câu:** Đừng object literal trong value, đừng một context ôm hết, đừng context hóa mọi thứ, và đừng đặt Provider sai tầng.

## Câu hỏi thường gặp

Mục này nói về các câu hỏi định lượng hay đắn nhất ("bao nhiêu tầng là drill", "context có chậm không") — tra nhanh khi quyết định.

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

Mục này nói về những cập nhật React 19/Zustand v5 liên quan bài này — đọc để không dùng cú pháp cũ.

- **React 19 render `<Context>` trực tiếp:** `<ThemeCtx value="dark">` thay `<ThemeCtx.Provider value="dark">` — gọn hơn, cùng ngữ nghĩa.
- **Zustand v5 + `useShallow` là "context cho state nóng":** phổ biến nhất hiện nay cho cart/filter, thay dần pattern context object lớn.
- **React Compiler tự memo children/provider value:** giảm bẫy object literal khi code tuân rules — nhưng vẫn nên memo tường minh cho value quan trọng.

## Best practices / Mẹo

Mục này nói về ba nhóm thói quen giữ chống-drilling hiệu quả: rule cá nhân, đo bằng Profiler, và ép dùng đúng qua hook. Đọc để hình thành phản xạ chuẩn.

### Rule cá nhân + composition đầu tay + hook cạnh context

"2 cấp drill bình thường; 3 composition; 4+ context/store." Composition (`children`, `header/footer`, `renderItem`) là vũ khí đầu tay — React khuyến khích, dễ đọc. Hook `useTheme()` cạnh `createContext` để import gọn.

### Profiler quyết định, không cảm tính; Provider gần nơi dùng; tách state/actions

Bôi đỏ Profiler cho biết ai vẽ thừa — sửa theo số. Provider gần nơi dùng nhất. Tách context state/actions để consumer actions không bị vẽ thừa. `useSyncExternalStore` cho store ngoài cần subscription tay.

### Hook con thay Context thô; tên slot rõ nghĩa; ghi lý do store trong PR

`useUser()` thay export Context thô để ép dùng đúng. Slot đặt tên rõ (`header`, `actions`). Ghi lý do chọn store thay context trong PR dựa trên số Profiler — người sau hiểu vì sao.

> **Tóm gọn 1 câu:** Chống drill bền vững nhờ số liệu (Profiler) ra quyết định, composition là vũ khí đầu tay, và Context thô luôn giấu sau một hook tên đẹp.

## Bài tập nhỏ

Mục này nói về bài thực hành refactor cây 4 tầng drill 2 props — làm một lần để Profiler "chấm bài" cho chính bạn.

App cây `App → Toolbar → Sidebar → Filters → SegmentPicker`. `SegmentPicker` cần `activeSegment` (đổi nhanh) và `locale` (ít đổi), cả hai đang drill 3 tầng:

1. Đưa `activeSegment` vào Zustand `useFilters(s => s.active)` — selector hẹp, đổi segment chỉ SegmentPicker vẽ lại.
2. Đưa `locale` vào `LocaleCtx` ở App — Provider bọc cây, consumer đọc trực tiếp.
3. Xóa props cầu nối khỏi Toolbar/Sidebar/Filters — xác nhận API sạch.
4. Mở Profiler, bấm đổi segment: kiểm tra Toolbar/Sidebar/Filters **không** bôi đỏ. Liệt kê file sửa, file sạch, và số lần render trước/sau.

> **Tóm gọn 1 câu:** Xong bài tập là bạn tự chứng minh được bằng Profiler: state nóng đi store, locale đi context, tầng giữa sạch bóng props cầu nối.

## Reference

- [Passing Props (React)](https://react.dev/learn/passing-props-to-a-component)
- [createContext](https://react.dev/reference/react/createContext)
- [Scaling Up with Reducer and Context](https://react.dev/learn/scaling-up-with-reducer-and-context)
- [Zustand — selectors](https://zustand.docs.pmnd.rs/guides/selectors)
