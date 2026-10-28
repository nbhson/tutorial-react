# Q43: Em đã bao giờ phải nâng ứng dụng lên version mới chưa, ví dụ app đang ở 18 mà có yêu cầu lên 19?

## Câu hỏi

> Em đã bao giờ có yêu cầu phải nâng ứng dụng lên version mới hơn chưa, ví dụ app đang ở version 18 nhưng có yêu cầu nâng lên 19?
> Lúc đó em làm theo các bước nào, và theo em chỗ nào dễ vỡ nhất?

## Trả lời ngắn (elevator pitch, 30 giây)

- **Nguyên tắc: đi từng nấc 17 → 18 → 19 → 19.x, không nhảy cóc** — mỗi nấc có một breaking change / checklist ăn theo, sửa xong nấc đó, test xanh rồi mới lên tiếp. Chạy codemod của team React trước khi sửa tay.
- **4 điểm vỡ theo nấc**: (1) **17 → 18**: `ReactDOM.render` bắt buộc đổi sang `createRoot` — không đổi thì concurrent/batching không chạy. (2) **Lên 18**: auto-batching + StrictMode double-effect lộ bug cũ (effect fetch 2 lần, subscription rò rỉ). (3) **18 → 19**: dọn API deprecated — string ref, `defaultProps` cho function component, `forwardRef` không còn bắt buộc (`ref` thành prop thường). (4) **19.x (19.2/19.3)**: không breaking, nhưng có checklist "ăn theo" — `<Activity>` thay hack giữ state, `useEffectEvent` tách logic non-reactive, `cacheSignal` abort fetch RSC, `<ViewTransition>`/Fragment ref chỗ hợp lý.
- **Riêng React Compiler (10/2025)**: migration kiểu tooling — `react-compiler-healthcheck` → ESLint plugin v6 sạch → cấu hình đúng theo bundler → rollout từng route → dọn `useMemo`/`useCallback`/`memo` thủ công.
- **Điểm ăn điểm**: "StrictMode là radar migration" — bật StrictMode ở dev, chỗ nào double-invoke mà sai là chỗ đó sẽ vỡ ở bản mới. Sửa cho StrictMode xanh trước khi nâng version thật.

## Trả lời chi tiết

### 1. Checklist trước khi động vào version

1. **Khoanh vùng API cũ**: tìm `ReactDOM.render`, `ReactDOM.hydrate`, string ref (`ref="name"`), `findDOMNode`, `defaultProps` trên function component, `UNSAFE_*` lifecycle. Đây là danh sách vỡ chắc chắn ở 19.
2. **Đo nền**: test e2e/smoke của flow chính phải xanh ở version hiện tại — nếu nền đã đỏ thì migration xong không biết đỏ do đâu.
3. **Bật StrictMode ở dev** (nếu chưa bật): double-render/double-effect sẽ lộ bug latent — sửa hết warning trước, vì bản mới siết chặt đúng những chỗ này.

### 2. Nấc 17 → 18: đổi root, nhận batching

```tsx
// ❌ 17: API cũ — lên 18 vẫn chạy nhưng mất concurrent + warning
import ReactDOM from "react-dom";
ReactDOM.render(<App />, document.getElementById("root"));

// ✅ 18+: root mới là bắt buộc
import { createRoot } from "react-dom/client";
createRoot(document.getElementById("root")!).render(<App />);
```

- **Auto-batching**: `setState` trong Promise/timeout giờ gộp thành 1 render (trước đây mỗi cái 1 render). UI ít render hơn — nhưng code nào đếm số lần render hoặc đọc DOM ngay sau `setState` trong timeout sẽ thấy khác.
- **StrictMode double-effect ở dev**: effect chạy mount → cleanup → mount lại. Effect không có cleanup đúng (fetch không abort, subscription không unsubscribe) sẽ lộ ngay — sửa bằng cleanup chuẩn, không tắt StrictMode để "cho qua".

### 3. Nấc 18 → 19: dọn deprecated, nhận API mới

| Đổi gì | Trước (18 chạy, 19 vỡ/bỏ) | Sau (19) |
|---|---|---|
| Root API | `ReactDOM.render` | `createRoot(...).render` (đã đổi ở nấc 18) |
| String ref | `ref="myInput"` | `useRef` + `ref={myRef}` |
| `defaultProps` (function) | `Comp.defaultProps = {...}` | Default parameter `function Comp({ a = 1 })` |
| `forwardRef` | Bắt buộc để nhận ref | Không cần — `ref` là prop thường: `function Input({ ref })` |
| `findDOMNode` / `UNSAFE_*` | Warning | Bỏ hẳn |

Chạy codemod trước, sửa tay phần còn lại:

```bash
npx codemod@latest react/19/migration-recipe
```

- Sau codemod vẫn phải review tay: codemod đổi cú pháp, không sửa được logic (ví dụ effect thiếu cleanup, ref type sai).
- API mới (Actions, `use()`, `useOptimistic`) là **cộng thêm, không bắt buộc** — migration xong app chạy đã, rồi mới refactor từng form sang Actions sau (xem Q2).

### 3b. Checklist 19.0 → 19.2 → 19.3: các nấc nhỏ nhưng có bẫy riêng

19.x là bản **minor** — không breaking như 18→19, nhưng bật/tắt hành vi và thêm API; checklist riêng để không bỏ sót:

| Nấc | Việc phải làm | Rủi ro nếu bỏ qua |
|---|---|---|
| **19.0 → 19.2** | Review chỗ dùng `<Suspense>`: dehydrated boundary giờ **ẩn/hiện lại đúng** khi resuspend; thử `<Activity mode="hidden">` thay unmount thủ công | Chỗ "giữ state khi ẩn" tự viết tay (display:none + effect) có thể thay bằng `<Activity>` — bỏ qua là giữ đống code thừa |
| **19.2** | Effect dùng giá trị chỉ để "đọc" mà ép vào deps? → chuyển sang `useEffectEvent` (đúng nghĩa, không phải chỗ chứa hack) | Effect vẫn re-run thừa vì dep "chỉ đọc"; hoặc tệ hơn: tự viết `useEffectEvent` ruột (ref hack) còn sót |
| **19.2 (RSC)** | Fetch trong `cache()` nên gắn `cacheSignal()` để abort khi cache hết hạn | Fetch "ma" chạy tiếp sau khi render hủy — lãng phí, treo server |
| **19.2 → 19.3** | `ref` trên Fragment (`<Fragment ref>`) thay code đo DOM từng item; `<ViewTransition>` thay transition tự viết | Code animation imperative cũ không hưởng auto animation; dual run 2 cơ chế |
| **19.3** | Component "browser-only" opt-out SSR bằng `use(browser())` thay vì gate `typeof window` thủ công | Kiểm tra `typeof window` rải rác trong render vẫn là anti-pattern và vi phạm Rules of React khi bật Compiler |

Chi tiết từng API: [`3_react-19-2`](../../4_react-new-feature/3_react-19-2/README.md) và [`4_react-19-3`](../../4_react-new-feature/4_react-19-3/README.md).

### 3c. Migration React Compiler (nấc "tooling" quan trọng nhất từ 10/2025)

Compiler **không phải version React** — nó là build plugin, nhưng migration có kỷ luật riêng:

1. **Đo trước**: `npx react-compiler-healthcheck` — bao nhiêu % component compile-safe, những file nào vi phạm (vi phạm chỉ bị **skip**, không vỡ build).
2. **Cài đúng cấu hình theo bundler** (chi tiết [`5_react-compiler/1_setup-vite-next`](../../4_react-new-feature/5_react-compiler/1_setup-vite-next/README.md)):
   - **Vite 8 + `@vitejs/plugin-react` v6**: option `babel` đã **bị bỏ** — dùng `react({ compiler: true })` (Oxc native, experimental) hoặc `@rolldown/plugin-babel` + `reactCompilerPreset()`. Config cũ `react({ babel: { plugins: [...] } })` **không còn hoạt động** trên plugin v6.
   - **Next 15**: `experimental.reactCompiler`; **Next 16**: `reactCompiler: true` top-level.
3. **ESLint trước, build sau**: `eslint-plugin-react-hooks` v6 (flat config) có rule compiler — sửa warning *trước* khi bật build-time compile để tránh "skip lặng lẽ".
4. **Rollout từng route**: bật cho 1 page, so sánh profile (số render trước/sau), rồi mở rộng. Dev-only issue: HMR ít escalate hơn (Q4).
5. **Dọn hậu quả**: xóa `useMemo`/`useCallback`/`memo` thủ công đã bị compiler thay thế — giữ 2 bên là 2 nguồn sự thật; chỉ giữ memo thủ công cho cache tính toán đắt (không phải reactivity).

**Bẫy riêng của nấc Compiler**: migration xong tưởng "app tự nhanh" — compiler chỉ loại re-render thừa do identity; nghẽn do render 10.000 dòng, network, layout vẫn phải giải bằng virtualization/code-split (Q31, Q23).

### 4. Lockstep dependency — React không nâng một mình

App không chỉ có `react`/`react-dom`. Checklist phần "vệ tinh":

| Package | Việc khi nâng React 19 |
|---|---|
| `@types/react`, `@types/react-dom` | Bắt buộc cùng major (19) — ref là prop thường, `JSX.Element` namespace đổi; type cũ vẫn "compile" nhưng sai ngữ nghĩa |
| react-redux / Zustand / TanStack Query | Kiểm tra peer range; bản quá cũ khai peer `<19` sẽ cài lỗi (npm ERESOLVE) |
| react-hook-form / RHF resolver | Đã tương thích 19 từ bản 7.5x+; test lại `ref` forwarding vì ref giờ là prop thường |
| `eslint-plugin-react-hooks` | v6+ cần cho rule của 19 + Compiler; flat config mặc định |
| Next.js / framework | Framework quyết định version React được nhúng — không tự bump react/react-dom trong Next project |

**Thứ tự an toàn**: nâng types trước (thấy hết warning chỗ dùng API cũ), rồi runtime, rồi framework.

### 5. TypeScript migration đi kèm

- `ref` as prop: bỏ `forwardRef` ⇒ đổi signature component: `function Input({ ref, ...props }: Props & { ref?: Ref<HTMLInputElement> })` hoặc dùng `ComponentProps<"input">`.
- `JSX.Element` → `React.JSX.Element` (global JSX namespace không còn auto-global trong types mới).
- `useReducer`/`useActionState` state union: khai rõ union type thay vì `any` — codemod không làm giúp phần này.

### 6. Kiểm thử migration: cái gì test được, cái gì không

- **Unit/integration** bắt được: API chết (render cũ), hành vi batching (đếm render), effect double-invoke (StrictMode), form action submit.
- **Test khó bắt nhưng vỡ thật**: hydration mismatch do render phụ thuộc `Date.now()`/`Math.random()` — cần e2e + so console dev.
- **Performance regression** không tự hiện qua test — đo trước/sau bằng React Profiler + Core Web Vitals; đặc biệt sau khi bật Compiler (đọc số liệu đừng "cảm thấy").
- **Chỉ số rollback**: error rate, INP/LCP p75, số render của 5 component nóng nhất — đều phải có baseline *trước khi* nâng, không thì không so được.

### 7. Migration thường đi kèm: dọn build tool (CRA → Vite 8)

Nâng React thường là lúc dọn tooling — CRA đã **deprecated**, khuyến nghị hiện nay là **Vite 8** (rolldown-based):

1. CRA eject **không phải phương án** — chuyển thẳng sang Vite: `npm create vite@latest` (template react-ts) rồi dời `src/` sang.
2. Đổi env: `REACT_APP_*` → `VITE_*` (`import.meta.env.VITE_X` thay `process.env.REACT_APP_X` — kiểm tra chỗ đọc env trong test).
3. CRA ẩn Webpack config (SVG import, `NODE_PATH`, polyfill Node) — Vite mặc định khác: import SVG as component cần plugin, `process.env` trong client code phải thay hết.
4. `@vitejs/plugin-react` v6 chạy Fast Refresh bằng Oxc — không cần Babel trừ khi dùng React Compiler (xem 3c).
5. Đường migration 2 bước nếu project lớn: Vite 7 + `rolldown-vite` → chạy thử → lên Vite 8.

### 8. Chiến lược triển khai an toàn

1. **Từng nấc một commit riêng**: 17→18 (root + batching) merge trước, chạy production một thời gian, rồi mới 18→19. Với 19.x: bump minor là PR riêng, Compiler là PR riêng nữa.
2. **Codemod trước, tay sau**: codemod lo 80% cú pháp máy móc; sức người dành cho 20% logic (effect, ref, test).
3. **Canary + rollback**: deploy bản mới cho % traffic nhỏ, soi error rate + Web Vitals; version React rollback được như mọi deploy — không cần feature flag riêng cho version.
4. **Không refactor nghiệp vụ trong cùng PR migration**: PR nâng version chỉ đổi version + fix vỡ. Viết lại form sang Actions hay đổi state management là PR khác.
5. **Checklist tổng theo thứ tự "sống sót nhất"**:

```
[ ] Test nền xanh ở version hiện tại (e2e flow chính)
[ ] Bật StrictMode dev — sửa hết warning
[ ] Tìm + dọn API chết: ReactDOM.render, string ref, findDOMNode, defaultProps (function), UNSAFE_*
[ ] Chạy codemod react/19/migration-recipe → review tay phần còn lại
[ ] Lên 19.0 — chạy production canary, soi error rate + Web Vitals
[ ] 19.2: review Suspense resuspend, thay hack "ẩn giữ state" bằng <Activity>, effectEvent chỗ hợp lý, cacheSignal cho fetch RSC
[ ] 19.3: thay transition thủ công bằng <ViewTransition> (nơi có), Fragment ref cho list ref động
[ ] Compiler: healthcheck → eslint-plugin-react-hooks v6 sạch → bật 1 route → đo → mở rộng → dọn memo thủ công
```

Mỗi dòng checklist = một PR/commit riêng; tick xong dòng nào production ổn định dòng đó mới tick tiếp.

### 9. Kịch bản phỏng vấn mở rộng: "nâng xong, user báo lỗi chỗ không test được"

Trả lời mẫu (thể hiện tư duy rollback, không phải việc "thử lại"):

1. **Bật lại version cũ trước, điều tra sau** — version React rollback như mọi deploy; không cần "hotfix gấp" trên bản mới.
2. **Định danh lỗi theo lớp**: hydration mismatch (SSR) hay runtime (client)? Crash build (types/dep) hay hành vi sai (batching/effect)? Mỗi lớp có nguyên nhân và fix khác nhau.
3. **Reproduction nhỏ nhất** từ log/sentry stack, tái tạo trong sandbox có cùng version + dep lockfile — không tái tạo được thì nghi config/env chênh lệch giữa môi trường.
4. **Lên lại với fix + guard**: thêm test regression cho đúng chỗ đó (đếm render, assert hydration warning), và thêm lint/codemod check chặn pattern gây lỗi.
5. **Bài học ghi vào checklist migration** — lần sau cùng loại app phải catch sớm ở bước StrictMode/e2e.

Điểm ăn điểm: phỏng vấn không đánh giá "em chưa từng vỡ" mà đánh giá **quy trình khi vỡ** — rollback trước, phân loại lỗi, guard sau.

### 10. Bảng quyết định: nâng hay chưa nâng?

| Tình huống app | Khuyến nghị |
|---|---|
| React 17, app nhỏ, ít dep | Nhảy thẳng lên 19 theo 2 nấc (17→18→19) trong 1 sprint, codemod lo phần lớn |
| React 18, không dùng API chết | Bump 19 gần như chỉ là đổi package + types; checklist rút gọn |
| React 18, codebase lớn + nhiều lib cũ | Tách PR: types → runtime → framework; canary + Web Vitals theo dõi |
| Đã 19.x | Checklist "ăn theo" (Activity/effectEvent/ViewTransition) làm dần theo PR refactor, không blocking |
| Cân nhắc Compiler | Sau khi 19.x ổn định — healthcheck + ESLint trước, rollout từng route |

Nguyên tắc chung: **nâng version là hạ tầng, refactor là feature** — hai việc, hai PR, hai vòng đánh giá rủi ro.

### 11. Câu hỏi drill-down sau câu chính

- **"Sao không nhảy thẳng lên bản mới nhất?"** — mỗi nấc là một tập breaking change riêng; gộp nhiều nấc thì khi test đỏ không khoanh được lỗi do nấc nào. Đi từng nấc, mỗi nấc một PR xanh.
- **"App 5 năm tuổi, không ai nhớ logic effect — nâng kiểu gì?"** — bật StrictMode trước ở bản cũ để double-invoke lộ effect thiếu cleanup, đo coverage của test nền, rồi mới bắt đầu nấc 17 → 18. Nấc 18 là nấc "lộ nợ" nhiều nhất.
- **"Codemod chạy xong có cần review không?"** — có: codemod đổi cú pháp (forwardRef → ref prop, bỏ defaultProps) chứ không hiểu nghiệp vụ; diff vẫn phải review + chạy test nền.
- **"Compiler bật sau hay trước khi nâng lên 19?"** — sau, và coi là migration tooling riêng: nó chạy được cả trên 17/18, nhưng nâng 19 xong code đã sạch deprecated thì healthcheck của compiler ít vi phạm hơn hẳn.

## Bẫy khi phỏng vấn

1. **"Nhảy thẳng 17 → 19 cho nhanh"** → **sai**: mỗi nấc có breaking change riêng, gộp lại không biết vỡ do đâu. Đi từng nấc, test xanh từng nấc.
2. **"Chạy codemod là xong"** → **sai**: codemod chỉ đổi cú pháp, không sửa logic (effect thiếu cleanup, batching đổi hành vi đọc state). Phải review + test.
3. **"Tắt StrictMode vì nó render 2 lần gây phiền"** → **sai nặng**: StrictMode chính là radar báo trước chỗ sẽ vỡ ở bản mới. Tắt là bịt mắt.
4. **"Migration xong là refactor luôn sang API mới cho bõ"** → **sai**: trộn migration + refactor vào một PR thì khi lỗi không biết do version hay do code mới. Tách riêng.
5. **"`ReactDOM.render` lên 19 vẫn chạy vì React tương thích ngược"** → **sai**: 19 bỏ hẳn, phải `createRoot` từ nấc 18.
6. **"19.2/19.3 là breaking change phải viết lại app"** → **sai**: minor release không bỏ API cũ; checklist chỉ là việc *ăn theo* (thay hack bằng API chính chủ), không bắt buộc để chạy.
7. **"Bật React Compiler là xong migration 19"** → **sai lần 2**: compiler là build plugin độc lập với version; bật được cả trên 17/18 (qua preset target) — nó không "kết thúc" migration, chỉ dọn memo thủ công.
8. **"Healthcheck xanh 100% mới được bật compiler"** → **chưa đúng**: component bị skip vẫn chạy đúng (chỉ không auto-memo). Bật dần, đo thực tế, sửa vi phạm dần.

## Gợi ý câu chốt

> "Migration React em đi **17 → 18 → 19 từng nấc**: trước hết khoanh API cũ (render cũ, string ref, defaultProps, findDOMNode) + bật StrictMode cho xanh + test nền xanh. Nấc 18 đổi **createRoot**, sửa effect lộ do double-invoke và batching mới. Nấc 19 chạy **codemod**, dọn deprecated (ref là prop thường, bỏ forwardRef/defaultProps). Sau đó 19.2/19.3 là checklist *ăn theo* minor: `<Activity>` thay hack giữ state, `useEffectEvent` tách logic non-reactive, `cacheSignal` abort fetch RSC, `<ViewTransition>`/Fragment ref chỗ hợp lý. Riêng **React Compiler** làm như migration tooling riêng: healthcheck → ESLint plugin v6 sạch → cấu hình đúng theo bundler (Vite 8: `react({ compiler: true })` hoặc `@rolldown/plugin-babel`; Next: flag `reactCompiler`) → rollout từng route → dọn memo thủ công. Mỗi nấc một PR, deploy canary, không trộn refactor nghiệp vụ. StrictMode xanh ở dev là tín hiệu lên version an toàn."

## Reference

- [React 18 Upgrade Guide](https://react.dev/blog/2022/03/29/react-18-upgrade-guide) — `createRoot`, batching, StrictMode
- [React 19 Upgrade Guide](https://react.dev/blog/2024/12/05/react-19-upgrade-guide) — deprecated bị bỏ, codemod
- [React 19.2 Release](https://react.dev/blog/2025/10/01/react-19-2) — `<Activity>`, `useEffectEvent`, `cacheSignal`, Performance Tracks
- [React 19.3 Release](https://react.dev/blog/2026/09/09/react-19-3) — `<ViewTransition>`, Fragment refs, `browser()`
- [React Compiler — Installation](https://react.dev/learn/react-compiler) — cấu hình Vite/Next + `reactCompilerPreset`
- [codemod React 19 recipe](https://codemod.com/registry/react-19-migration-recipe) — chạy tự động trước khi sửa tay

## Câu hỏi liên quan

- **Hỏi tiếp (liên tục)**: [Q2 — 19 khác 18 lớn nhất ở đâu?](../02-react-18-vs-19/README.md) · [Q3 — StrictMode báo gì khi migrate?](../03-strictmode/README.md)
- **Đào sâu (xuyên nhóm)**: [Q26 — batching đổi hành vi gì ở 18?](../26-batching-stale-closure/README.md) · [Q23 — bundle sau nâng có phình không?](../23-bundle-size/README.md)
