# Q36: App React to dần, nhiều người làm chung, em chia folder ra sao? App nhỏ có cần vậy không?

## Câu hỏi

> App React lớn (10-20+ màn, 5+ dev làm chung) nên tổ chức code thế nào —
> theo feature (FSD, container-presenter) hay theo loại file?
> Vì sao component presenter nên là pure function của props?
> Giới hạn import (không được import chéo tầng) thì ép bằng gì?
> Và thực tế: app prototype 5 màn, 1 dev thì có nên áp luôn không?

## Trả lời ngắn (elevator pitch, 30 giây)

Mục này là "bản nói 30 giây" — trả lời được khung 3 gạch đầu dòng là đã chạm đúng tư duy kiến trúc; phần chi tiết bên dưới để đỡ khi bị hỏi đào.

- App lớn thì xếp code **theo feature nghiệp vụ**, không theo loại file. Khung phổ biến: FSD (6 tầng, import một chiều, mỗi slice có public API) hoặc tách lấy-data khỏi vẽ (container–presentational), logic gom vào hook để test.
- Đáng tiền ở 3 điểm: giới hạn ai được nhìn vào ai, component vẽ thuần thì test bằng props giả, mỗi người sở hữu một slice.
- App 5 màn 1 người thì đừng bày vẽ: xếp phẳng theo feature, đau thật (100 component tìm không ra, props 4+ tầng) mới nâng. Kiến trúc là thuốc chữa đau cụ thể, không phải đích đến.

## Trả lời chi tiết

Mục này lần lượt đi qua các mẫu tổ chức code, rồi chốt bằng câu hỏi thực tế nhất: "app nhỏ có cần không?" — đọc để nắm được cả "khi nào dùng" chứ không chỉ tên gọi các mẫu.

### 1. Các mẫu (nói "khi nào dùng" = ăn điểm, không phải liệt kê)

| Mẫu | Áp dụng khi | Giá trị | Bẫy |
|---|---|---|---|
| **Feature-flat** (1 feature = 1 thư mục, `features/users/{components,hooks,api}`) | App nhỏ–trung (1–5 dev) | Đơn giản, mọi thứ 1 chỗ per feature | Nhiều feature → trùng code (cần tách `shared`) |
| **FSD** (6 layer `app→pages→widgets→features→entities→shared`) | App **lớn** (10–20+ màn, 5+ dev, dự án dài) | Giới hạn phụ thuộc (import một chiều), public API, scale team | Nghi thức (boundary + ESLint) — app nhỏ = thừa (over-engineer) |
| **Container–Presentational** | Component nhiều việc (fetch + render + state, > 50 dòng) | Test dễ (view = pure props), đổi data source không đụng UI | Tách 2 component cho 1 nơi duy nhất = thừa (component lá 10 dòng) |
| **MVVM (hooks)** | Form/wizard nhiều state phụ thuộc (logic phức tạp) | Tách logic ra hook (test `renderHook`, không mount UI) | Viết hook view-model cho form đơn giản = thừa (Q17 `useState` đủ) |
| **Hexagonal (ports-adapters)** | Nghiệp vụ phức tạp + nhiều nguồn (REST + WS + cache), đáng test | Core thuần TS (không import framework/adapter), test không mock fetch | Tách hex cho app nhỏ = thừa (bẫy hoành tráng) |

> **Cách đọc bảng này:** mỗi dòng là một mẫu kiến trúc; cột "Áp dụng khi" là quan trọng nhất (đọc đầu tiên) vì câu này ăn điểm ở việc CHỌN chứ không phải LIỆT KÊ — cột Giá trị cho biết đổi được gì, cột Bẫy cho biết dùng sai cỡ nào là phí.

### 2. Container–Presentational (mẫu ăn điểm cho "test dễ")

**Presentational = "pure function of props"**: cùng props → cùng UI; không fetch, không đọc store, không nhiều `useState`; tương tác nhận **callback** qua props. Ví von: container là đầu bếp (ra bếp lấy nguyên liệu, làm sẵn), presentational là người phục vụ (chỉ bưng đúng món đã dọn lên bàn — không tự vào bếp bao giờ).

> 📄 **Code ví dụ:** [`examples/01-2-container-presentational-mau-an-iem-cho-test.tsx`](examples/01-2-container-presentational-mau-an-iem-cho-test.tsx)

**Vì sao đáng giá (điểm ăn điểm)**:
- **Test view thuần**: `render(<UserCardView name="A" selected={false} onSelect={fn} />)` — props giả, không mock fetch, không cần data thật. Đổi data source (API → cache → mock) = **không đụng view** (chỉ container).
- **RSC (2026)**: **server component = container tự nhiên** (fetch trên server, gửi props xuống client); **client component = presentational** (tương tác) — pattern tái sinh **dạng built-in** (Next.js lo, không tự tổ chức — Q2).

### 3. FSD (6 layer) — giới hạn phụ thuộc (mẫu scale team)

```
app/        (1 nơi mount toàn app)
└─ pages/     (màn: tổ hợp widgets/features)
   └─ widgets/ (khối UI lớn cross-page: header, list)
      └─ features/ (logic nghiệp vụ: order flow, checkout)
         └─ entities/ (model nghiệp vụ: User, Order)
            └─ shared/ (lib chung: UI kit, utils, api client)
```

- **Import một chiều** (từ tầng cao xuống tầng thấp: `pages → widgets → features → entities → shared`): feature A **không nhìn nội bộ** feature B — chỉ qua **public API** của B. Ví von: như tòa nhà văn phòng chỉ mở một cửa chính duy nhất cho khách — muốn gặp phòng nào thì nhờ lễ tân (public API `index.ts`), chứ không ai leo tường, xuyên tường sang phòng hàng xóm.
- **Public API mỗi slice**: mỗi thư mục feature có **`index.ts`** chỉ lộ thứ nên dùng (component, hook) — **cấm import sâu vào nội bộ** (`@/features/users/UserService` = vi phạm; chỉ `@/features/users`).
- **Ép bằng ESLint** (không phải quy ước trong đầu): rule import boundary (ESLint flat + plugin boundaries) — CI **đỏ** khi import vi phạm. Quản lý code bằng **tool**, không bằng kỷ luật tay.

> **Ăn điểm**: FSD **và bulletproof** là 2 phiên bản cùng ý tưởng (giới hạn phụ thuộc): FSD = 6 layer chuẩn (nghi thức đầy đủ), bulletproof = **thực dụng** (alias `@/` + `components/features/lib/providers`) cho team 5–15 dev. Chọn theo mức nghi thức dự án cần.

### 4. Chống prop-drilling (liên hệ Q4/Q9) — khi nào nâng cấp

- **1–2 tầng drill** = bình thường (props đúng, React mặc định). **3+ tầng** = cân nhắc **composition** (`children`/slots). **4+ tầng** = tín hiệu **context (ít đổi)** / **store (đổi nhiều)** (Q9/Q13/Q15).
- Nguyên tắc quyết định: **đừng nhảy tầng sớm** — drill 2 tầng cho feature nhỏ là đúng; dùng context/store khi **3+ tầng** xuất hiện thật (context sớm = re-render lan, Q14). Chống prop-drilling = **thông minh chọn tầng nào (1 / 3 / 4+)**, không phải "context mọi thứ".

### 5. Vì sao KHÔNG áp cho app nhỏ (điểm ăn điểm nhất — phân biệt senior vs vẹt)

| App | Đúng | Sai |
|---|---|---|
| **Prototype (5 màn, 1 dev)** | **Feature-flat** (1 feature = 1 thư mục, mọi thứ 1 chỗ) | FSD 6 layer + ESLint boundary (nghi thức lớn hơn code) |
| **MVP (10 màn, 2–3 dev)** | Feature-flat + tách `shared` (UI kit, api client — thứ chia nhiều lần đầu tiên) | FSD trước khi có 10 màn (sớm) |
| **Prod (20+ màn, 5+ dev, dài hạn)** | **FSD / bulletproof** (boundary + public API) | Feature-flat vô định (100 component, không ai tìm được file nào) |

> **Cách đọc bảng này:** mỗi dòng là một quy mô app (từ nhỏ đến lớn); cột Đúng là lựa chọn khớp cỡ đó, cột Sai là lỗi phổ biến khi mang nghi thức sai cỡ — quy tắc đọc: cỡ app của bạn đang ở dòng nào thì làm theo cột Đúng của dòng đó.

> **Quy tắc senior (nói đúng câu chốt)**: kiến trúc **không phải mục tiêu (điểm đến)** — mà là **công cụ giải quyết đau cụ thể** (prop-drilling 4+ tầng, 100 component không tìm được, 5 dev cùng chạm 1 file). App nhỏ chưa đau = **đừng mang nghi thức lớn** (over-engineer). **Bắt đầu đơn giản, nâng cấp khi đau thật sự** (chống chỉ định chính của nhóm architecture).

> **Tóm gọn 1 câu:** Kiến trúc là thuốc chữa đau cụ thể chứ không phải vitamin uống trước cho khỏe — app nhỏ xếp phẳng theo feature, đau thật (nhiều người, nhiều màn, tìm không ra file) mới nâng cấp.

## Bẫy khi phỏng vấn

Mục này là "bản đồ mìn": 5 cách trả lời nghe chuẩn mực nhưng lộ vẹt — đọc để biết người ta thử bạn ở chỗ nào.

1. **"Nói FSD là chuẩn cho mọi app React"** → **sai**: kích thước + số dev quyết định — prototype = **feature-flat** (FSD = over-engineer, nghi thức > code). Câu ăn điểm: **quyết định theo đau, không theo chuẩn**.
2. **"Nói container = presentational = RSC (1 thứ)"** → **khác mức**: container–presentational = tách 2 component (SPA, tự tổ chức); RSC = **server component là container tự nhiên** (framework lo — Q2). Cùng tư duy, khác ai thực thi.
3. **Trình bày FSD "6 layer" thuộc lòng nhưng không nói được KHI NÀO DÙNG** → lộ vẹt (biết cái gì nhưng không biết chọn cỡ nào theo kích thước/dev/đau). Điểm ăn điểm = **chọn đúng + nêu được chống chỉ định** (§5).
4. **"Context cho mọi prop-drilling (nguyên tắc)"** → **sai**: 1–2 tầng drill = bình thường (props), 3+ = cân nhắc, 4+ = context/store (Q4/Q9). Context sớm = re-render lan (Q14).
5. **"Public API + import boundary = convention (quy ước trong đầu)"** → **sai**: FSD **ép bằng ESLint** (CI đỏ khi vi phạm) — không trông cậy kỷ luật con người (lúc lười là phá). **Tool enforce boundary** là điểm ăn điểm (kiên định, scale được).

> **Tóm gọn 1 câu:** Bẫy lớn nhất là học thuộc tên mẫu kiến trúc nhưng không nêu được "khi nào dùng" — người ta tuyển người biết chọn đúng cỡ thuốc theo cỡ bệnh, không tuyển người đọc nhãn thuốc giỏi.

## Gợi ý câu chốt

Mục này gói cả bài thành một đoạn trả lời mẫu — đọc để tập nói trọn một hơi rồi diễn đạt lại bằng giọng của mình.

> "App **lớn** (10–20+ màn, 5+ dev): tổ chức **theo feature** (không theo loại file) — **FSD** (6 layer, import một chiều, public API `index.ts`, ESLint ép boundary) hoặc **bulletproof** (thực dụng). **Container–presentational**: view = **pure function of props** (test bằng props giả, không mock data; đổi data source không đụng UI) — RSC (2026) là container tự nhiên (server fetch, client interact). **MVVM**: logic ra hook (test `renderHook`). **Hexagonal**: core nghiệp vụ thuần TS, không import adapter (nâng cao nhất). Chống prop-drilling: 1–2 tầng OK, 3+ composition, 4+ context/store. **Chống chỉ định (đắt giá nhất)**: app nhỏ (prototype) → feature-flat, **ĐỪNG FSD** (nghi thức > code); **nâng cấp khi đau thật**. 'Kiến trúc = công cụ giải quyết đau cụ thể, không phải mục tiêu'."

## Reference

- [`2_react-techniques/2_architecture-patterns`](../../2_react-techniques/2_architecture-patterns) — Tổng quan (khi nào cần: 10–20+ màn / nhiều dev; **chống chỉ định: prototype → đừng áp**), 5 mẫu (FSD, container–P, MVVM, prop-drilling, hexagonal)
- [`2_react-techniques/2_architecture-patterns/2-container-presentational`](../../2_react-techniques/2_architecture-patterns/2-container-presentational) — presentational = pure function of props (test props giả), container = data hook, "RSC = container tự nhiên", "MVVM khác từ khóa"
- [`2_react-techniques/2_architecture-patterns/4-stop-prop-drilling`](../../2_react-techniques/2_architecture-patterns/4-stop-prop-drilling) — "1–2 tầng drill OK, 3+ composition, 4+ context/store"
- [`2_react-techniques/2_architecture-patterns/1-feature-sliced-bulletproof`](../../2_react-techniques/2_architecture-patterns/1-feature-sliced-bulletproof) — FSD 6 layer (import một chiều, public API, ESLint boundary) + bulletproof (thực dụng)
- Q4 (lifting state) / Q9 / Q13 / Q15 — thang chọn tầng (prop 1–2, composition 3+, context/store 4+), "context ít đổi / store đổi nhiều"
- Q2 (React 18 vs 19) — **Server Components** (container tự nhiên, RSC nâng cấp container–presentational)

## Câu hỏi liên quan

- **Hỏi tiếp (liên tục)**: [Q9 — state đặt ở đâu (feature-flat, lifting)?](../09-lifting-state-up/README.md) · [Q34 — tổ chức ref/hooks theo feature?](../34-ref-callback-n-items/README.md)
- **Đào sâu (xuyên nhóm)**: [Q20 — data layer (Query) đặt ở tầng nào (shared)?](../20-data-fetching/README.md) · [Q24 — guard/loader (thuộc trang hay app)?](../24-router-guard/README.md) · [Q35 — typing xuyên tầng (public API)?](../35-type-safety/README.md)
