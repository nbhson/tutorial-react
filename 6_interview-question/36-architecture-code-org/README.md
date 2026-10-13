# Q36: App React to dần, nhiều người làm chung, em chia folder ra sao? App nhỏ có cần vậy không?

## Câu hỏi

> App React lớn (10-20+ màn, 5+ dev làm chung) nên tổ chức code thế nào —
> theo feature (FSD, container-presenter) hay theo loại file?
> Vì sao component presenter nên là pure function của props?
> Giới hạn import (không được import chéo tầng) thì ép bằng gì?
> Và thực tế: app prototype 5 màn, 1 dev thì có nên áp luôn không?

## Trả lời ngắn (elevator pitch, 30 giây)

- **Nguyên tắc nền**: app lớn (nhiều màn + nhiều dev + dự án dài) → tổ chức code **theo feature nghiệp vụ** (không theo loại file kỹ thuật). Hai khung chính: **FSD** (6 layer `app→pages→widgets→features→entities→shared`, import một chiều, public API mỗi slice) và **container–presentational** (tách "lấy data/logic" khỏi "render thuần"). MVVM (hooks) + hexagonal là nâng cấp (tách logic ra hook / tách nghiệp vụ khỏi framework).
- **Vì sao đáng tiền**: **giới hạn phụ thuộc** (component A của feature X không nhìn vào nội bộ feature Y — chỉ qua public API), **test dễ** (presentational = pure function of props, test bằng props giả, không mock data), **scale team** (mỗi dev sở hữu 1 slice/feature).
- **Chống chỉ định (điểm ăn điểm nhất)**: **app prototype (5 màn, 1 dev)** → **ĐỪNG over-engineer** (FSD 6 layer + ESLint boundary = nghi thức hơn code). **Bắt đầu đơn giản** (feature-flat), **nâng cấp khi đau thật sự** (100 component không ai tìm được, prop-drilling 4+ tầng).
- **Nối 2026**: **Server Components** = container tự nhiên (fetch server, gửi props client) — container–presentational tái sinh dạng built-in (Next.js), không tự tổ chức (RSC, Q2).

## Trả lời chi tiết

### 1. Các mẫu (nói "khi nào dùng" = ăn điểm, không phải liệt kê)

| Mẫu | Áp dụng khi | Giá trị | Bẫy |
|---|---|---|---|
| **Feature-flat** (1 feature = 1 thư mục, `features/users/{components,hooks,api}`) | App nhỏ–trung (1–5 dev) | Đơn giản, mọi thứ 1 chỗ per feature | Nhiều feature → trùng code (cần tách `shared`) |
| **FSD** (6 layer `app→pages→widgets→features→entities→shared`) | App **lớn** (10–20+ màn, 5+ dev, dự án dài) | Giới hạn phụ thuộc (import một chiều), public API, scale team | Nghi thức (boundary + ESLint) — app nhỏ = thừa (over-engineer) |
| **Container–Presentational** | Component nhiều việc (fetch + render + state, > 50 dòng) | Test dễ (view = pure props), đổi data source không đụng UI | Tách 2 component cho 1 nơi duy nhất = thừa (component lá 10 dòng) |
| **MVVM (hooks)** | Form/wizard nhiều state phụ thuộc (logic phức tạp) | Tách logic ra hook (test `renderHook`, không mount UI) | Viết hook view-model cho form đơn giản = thừa (Q17 `useState` đủ) |
| **Hexagonal (ports-adapters)** | Nghiệp vụ phức tạp + nhiều nguồn (REST + WS + cache), đáng test | Core thuần TS (không import framework/adapter), test không mock fetch | Tách hex cho app nhỏ = thừa (bẫy hoành tráng) |

### 2. Container–Presentational (mẫu ăn điểm cho "test dễ")

**Presentational = "pure function of props"**: cùng props → cùng UI; không fetch, không đọc store, không nhiều `useState`; tương tác nhận **callback** qua props.

```tsx
// SAI: 1 component làm 3 việc (fetch + state + render)
function UserList() {
  const { data } = useQuery({ queryKey: ["users"], queryFn: fetchUsers });
  const [sel, setSel] = useState<string | null>(null);
  if (data) return <ul>{data.map((u) => <li key={u.id} onClick={() => setSel(u.id)}>{u.name}</li>)}</ul>;
  return <p>Loading…</p>;
}

// ĐÚNG: tách 2 (container lấy data, view render thuần)
function UserCardView({ name, selected, onSelect }: { name: string; selected: boolean; onSelect: () => void }) {
  return <button aria-pressed={selected} onClick={onSelect}>{name}</button>; // pure: props -> UI
}
function UserListContainer() {
  const { data } = useQuery({ queryKey: ["users"], queryFn: fetchUsers });
  const [sel, setSel] = useState<string | null>(null);
  return data
    ? <ul>{data.map((u) => <UserCardView key={u.id} name={u.name} selected={sel === u.id} onSelect={() => setSel(u.id)} />)}</ul>
    : <p>Loading…</p>;
}
```

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

- **Import một chiều** (từ tầng cao xuống tầng thấp: `pages → widgets → features → entities → shared`): feature A **không nhìn nội bộ** feature B — chỉ qua **public API** của B.
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

> **Quy tắc senior (nói đúng câu chốt)**: kiến trúc **không phải mục tiêu (điểm đến)** — mà là **công cụ giải quyết đau cụ thể** (prop-drilling 4+ tầng, 100 component không tìm được, 5 dev cùng chạm 1 file). App nhỏ chưa đau = **đừng mang nghi thức lớn** (over-engineer). **Bắt đầu đơn giản, nâng cấp khi đau thật sự** (chống chỉ định chính của nhóm architecture).

## Bẫy khi phỏng vấn

1. **"Nói FSD là chuẩn cho mọi app React"** → **sai**: kích thước + số dev quyết định — prototype = **feature-flat** (FSD = over-engineer, nghi thức > code). Câu ăn điểm: **quyết định theo đau, không theo chuẩn**.
2. **"Nói container = presentational = RSC (1 thứ)"** → **khác mức**: container–presentational = tách 2 component (SPA, tự tổ chức); RSC = **server component là container tự nhiên** (framework lo — Q2). Cùng tư duy, khác ai thực thi.
3. **Trình bày FSD "6 layer" thuộc lòng nhưng không nói được KHI NÀO DÙNG** → lộ vẹt (biết cái gì nhưng không biết chọn cỡ nào theo kích thước/dev/đau). Điểm ăn điểm = **chọn đúng + nêu được chống chỉ định** (§5).
4. **"Context cho mọi prop-drilling (nguyên tắc)"** → **sai**: 1–2 tầng drill = bình thường (props), 3+ = cân nhắc, 4+ = context/store (Q4/Q9). Context sớm = re-render lan (Q14).
5. **"Public API + import boundary = convention (quy ước trong đầu)"** → **sai**: FSD **ép bằng ESLint** (CI đỏ khi vi phạm) — không trông cậy kỷ luật con người (lúc lười là phá). **Tool enforce boundary** là điểm ăn điểm (kiên định, scale được).

## Gợi ý câu chốt

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
