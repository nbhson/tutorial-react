# Architecture Patterns — Tổng quan

> Nguồn: https://github.com/alan2207/bulletproof-react — https://feature-sliced.design/ — https://alistair.cockburn.us/hexagonal-architecture/

Nhóm này cover các **mẫu kiến trúc** tổ chức code ở quy mô app từ trung bình đến lớn: cách chia thư mục theo feature, tách trách nhiệm component, mô hình MVVM thông qua hooks, chống prop-drilling, và đóng gói nghiệp vụ thuần (hexagonal). Nội dung bổ trợ nhau: có thể áp dụng FSD làm khung, hexagonal cho vùng nghiệp vụ, MVVM cho từng màn hình.

## Nhóm này giải quyết gì

Khi app lớn lên, vấn đề không còn là "viết được component" mà là **tổ chức code sao cho còn hiểu được, sửa được, test được**:

1. **Thư mục spaghetti** — 100 component, 50 hook nằm phẳng, không biết file nào thuộc tính năng nào → cần chia theo feature.
2. **Component "đa nhân cách"** — vừa fetch, vừa render, vừa giữ state, khó test → cần tách trách nhiệm.
3. **Logic trộn với giao diện** — form/wizard nhiều state phụ thuộc, test khó → cần ViewModel.
4. **Props "khoan" qua nhiều tầng** — tầng trung gian không dùng vẫn phải khai báo → cần composition/context/store.
5. **Nghiệp vụ dính chặt framework** — đổi API phải sửa cả UI, test phải mock fetch → cần hexagonal (port/adapter).

> **Tóm gọn 1 câu:** Nhóm này dạy "dọn dẹp khi nhà chật": chia phòng theo feature, phân vai trong phòng, và khóa chiều phụ thuộc.

## Khi nào cần

Mục này nói về ánh xạ giữa "triệu chứng" của dự án và bài nên đọc. Đọc để chọn bài đúng chỗ đau thay vì đọc xuôi hết.

- App vượt **~10–20 màn hình**, nhiều dev làm chung, hoặc dự án dài hạn cần scale → **bài 1 (FSD/bulletproof)**.
- Component vượt ~50 dòng, vừa fetch vừa render → **bài 2 (container–presentational)**.
- Màn hình/form nhiều state phụ thuộc nhau, cần test logic tách khỏi UI → **bài 3 (MVVM)**.
- Data đi qua 3+ tầng trung gian không dùng → **bài 4 (chống prop-drilling)**.
- Nghiệp vụ phức tạp đáng test, nhiều nguồn dữ liệu (REST + WS + cache) → **bài 5 (hexagonal)**.

**Chống chỉ định chung**: đừng áp "kiến trúc hoành tráng" cho app prototype — bắt đầu đơn giản, nâng cấp khi đau thật sự.

## Các bài con

Mục này nói về 5 bài trong nhóm kèm mô tả ngắn. Đọc bảng để chọn điểm vào phù hợp.

| # | Bài | Nội dung |
|---|---|---|
| 1 | [1-feature-sliced-bulletproof/](1-feature-sliced-bulletproof/README.md) | **Feature-Sliced Design + bulletproof-react**: layers `app→pages→widgets→features→entities→shared`, quy tắc import một chiều, public API (`index.ts`) mỗi slice, ESLint bảo vệ boundaries. Chia code theo feature nghiệp vụ thay vì theo loại file kỹ thuật. |
| 2 | [2-container-presentational/](2-container-presentational/README.md) | **Container–Presentational**: tách component lấy data/logic (container) khỏi component render thuần (presentational), liên hệ với Server Components & custom hooks. Presentational là "pure function of props", test bằng props giả không cần mock data. |
| 3 | [3-mvvm-hooks/](3-mvvm-hooks/README.md) | **MVVM với Hooks**: `useViewModel` giữ state + logic thuần không JSX, View chỉ render; test bằng `renderHook` không cần render UI; `useReducer` cho state phức tạp. Phù hợp form/wizard nhiều state phụ thuộc. |
| 4 | [4-stop-prop-drilling/](4-stop-prop-drilling/README.md) | **Chống prop-drilling**: thứ tự ưu tiên composition (`children`/slots) → context (ít đổi) → store Zustand selector (đổi nóng), context splitting & tránh re-render lan. Quy ước: 1–2 tầng drill bình thường, 3+ cân nhắc composition, 4+ là tín hiệu context/store. |
| 5 | [5-hexagonal/](5-hexagonal/README.md) | **Hexagonal / Ports & Adapters**: core nghiệp vụ thuần TS + port interface + adapter (http/mock), DI thủ công qua tham số, test không cần mock fetch, kết hợp TanStack Query. Core không bao giờ import adapter — adapter import core. |

> **Cách đọc bảng này:** mỗi dòng là một bài, xếp từ bài "cơ bản nhất" (4) đến bài "tổng hợp" (1) theo độ sâu; đọc phần in đậm đầu mỗi ô để biết tên vấn đề, phần sau là chi tiết kỹ thuật — quyết định vào bài nào rồi mới đọc sâu.

## Thứ tự đọc gợi ý

Mục này nói về lộ trình đọc đề xuất từ vấn đề nhỏ nhất đến tổng hợp. Đọc để không nhảy cóc vào bài đòi nền tảng trước đó.

```
4 (cơ bản nhất) → 2 → 3 → 5 → 1 (tổng hợp)
```

- **4 (chống prop-drilling)**: vấn đề nhỏ nhất, gặp ngay khi viết component — làm nền tư duy truyền dữ liệu.
- **2 (container–presentational)**: học cách tách trách nhiệm trong một component.
- **3 (MVVM)**: nâng lên tách logic ra khỏi component hoàn toàn (custom hook).
- **5 (hexagonal)**: tách cả miền nghiệp vụ khỏi framework — tầng sâu hơn.
- **1 (FSD/bulletproof)**: bài tổng hợp, đặt tất cả vào một cấu trúc thư mục có luật.

> **Tóm gọn 1 câu:** Đọc theo nấc thang từ nhỏ đến lớn: truyền data (4) → tách trong component (2) → tách logic (3) → tách nghiệp vụ (5) → xếp hết vào thư mục (1).

## Liên quan tới bài nào khác

Mục này nói về sợi dây giữa nhóm này và các nhóm khác trong repo. Đọc khi cần truy vết kiến thức nền hoặc mở rộng.

- **Bài 1 (FSD)** liên hệ `6_dev-tools/2-eslint-flat-hooks` (enforce import boundaries) và `8_best-practices/1_style-guide` (quy ước đặt tên slice).
- **Bài 2 (container–presentational)** dùng TanStack Query ở nhóm `1_advanced-features/3-store-zustand-tanstack-query` để làm container.
- **Bài 3 (MVVM)** kết hợp `3_performance-optimization/1-react-compiler-memo` (ViewModel tránh re-render) và `6_dev-tools/3-vitest` (`renderHook`).
- **Bài 4 (prop-drilling)** dùng Zustand + Context ở `1_advanced-features/3`; đo re-render bằng `6_dev-tools/4-devtools-perf`.
- **Bài 5 (hexagonal)** là chiều phụ thuộc bổ trợ cho FSD (bài 1) — FSD nói "nơi đặt file", hexagonal nói "chiều phụ thuộc".

## Mô tả chi tiết từng bài

Mục này nói về tóm tắt kỹ thuật cốt lõi từng bài — đọc để nắm "cái hồn" mà chưa cần mở file con.

### 1. Feature-Sliced Design + bulletproof-react
Hai phong cách hội tụ ở ý chính: *nhóm code theo chức năng nghiệp vụ, giới hạn phạm vi phụ thuộc*. FSD chia layers `app → pages → widgets → features → entities → shared`, chỉ được import từ tầng thấp hơn; mỗi slice lộ **public API** qua `index.ts`, cấm import sâu vào nội bộ. bulletproof-react là bộ quy ước thực dụng hơn (alias `@/`, `components`–`features`–`lib`–`providers`) cho team 5–15 dev. Có thể cưỡng chế bằng ESLint boundaries.

### 2. Container–Presentational
Tách component "vừa fetch vừa render" thành **presentational** (thuần props, không fetch/store) và **container** (gọi `useQuery`/store, quyết định loading/error, map sang props). Presentational dễ test bằng props giả. Trong RSC, *server component* là container tự nhiên, *client component* là presentational tương tác — pattern tái sinh dưới dạng built-in.

### 3. MVVM với Hooks
`useViewModel` là custom hook giữ toàn bộ state + logic, **không JSX**; View chỉ render và gọi `vm.action()`. Lợi thế lớn nhất là testability: `renderHook(() => useLoginViewModel())` chạy submit, kiểm `error`/`pending` mà không cần render UI. Dùng `useReducer`/state machine khi state có ≥ 4–5 biến phụ thuộc nhau (form, wizard, payment).

### 4. Chống Prop-Drilling
Thứ tự ưu tiên chuẩn 2026: **composition → context → store**. Composition (children/slots) rẻ nhất, không đổi API; context cho dữ liệu ít đổi, nhiều nơi đọc; store Zustand selector cho state "nóng" nhiều writer. Quy ước thực dụng: 1–2 tầng drill bình thường, 3+ cân nhắc composition, 4+ là tín hiệu context/store. Tách context theo domain để tránh re-render lan.

### 5. Hexagonal / Ports & Adapters
Đặt nghiệp vụ ở **core** (entity + use-case thuần TS) và mọi thứ bên ngoài (fetch, storage, UI) thành **adapter** cắm qua **port** (interface). Core không bao giờ import adapter — adapter import core (dependency inversion). Ví von: core là cục pin rời, adapter là phích cắm, port là ổ điện chuẩn — cục pin không quan tâm cắm vào đèn hay quạt. DI thủ công qua tham số; test use-case bằng object literal, không cần mock fetch. Kết hợp TanStack Query: `queryFn` gọi use-case đã bơm adapter.

## Sai lầm thường gặp (tổng hợp)

Mục này nói về 6 sai lầm lặp lại trên cả 5 bài — gom về một chỗ để tra nhanh khi kiến trúc "bất ổn".

- **Import ngược tầng trong FSD** (shared import features) → vòng phụ thuộc, build chậm; cưỡng chế bằng ESLint boundaries (bài 1).
- **Tách 2 file cho mọi component** → số file gấp đôi chỉ để render 5 dòng; chỉ tách khi component > ~50 dòng (bài 2).
- **ViewModel phình "god hook"** → khó test; composition từng hook nhỏ (bài 3).
- **Context value là object literal** (`value={{ theme, setTheme }}`) → re-render mọi consumer; `useMemo` hoặc tách provider (bài 4).
- **Core import adapter** → mất ý nghĩa đảo phụ thuộc; core chỉ nhận port qua tham số (bài 5).
- **Áp "kiến trúc hoành tráng" cho prototype** → over-engineering; bắt đầu đơn giản, nâng khi đau thật.

> **Tóm gọn 1 câu:** Sáu sai lầm chung một gốc: dùng đúng công thức sai liều — sai chiều phụ thuộc, tách quá sớm/qua mức, hoặc dựng thành trì cho nơi không cần.

## Câu hỏi thường gặp

Mục này nói về các câu hỏi lựa chọn hay đắn nhất khi áp kiến trúc — tra nhanh khi phân vân.

- **Dự án nhỏ có cần FSD?** Không nhất thiết — bắt đầu bulletproof tối giản (`features/`, `shared/`), tách dần khi quy mô tăng.
- **Có phải lúc nào cũng tách container/presentational?** Không; chỉ khi component > ~50 dòng, vừa fetch vừa render, hoặc view dùng lại.
- **MVVM khác container thế nào?** Container là component chứa logic + render con; ViewModel là hook thuần logic, View tách hoàn toàn.
- **Bao nhiêu tầng thì gọi là prop-drilling?** 1–2 tầng bình thường, 3+ cân nhắc composition, 4+ là context/store.
- **Hexagonal có overkill cho CRUD?** Với CRUD thuần đơn giản, có; chỉ áp khi nghiệp vụ đáng test hoặc nhiều nguồn dữ liệu.

## Điểm chung

Mục này nói về quy ước áp dụng cho mọi demo trong nhóm và cách các pattern kết hợp với nhau.

- Mỗi thư mục con có `example.tsx` minh họa thực hành, comment tiếng Việt từng dòng.
- Các pattern có thể kết hợp: FSD (tổ chức thư mục) + hexagonal (ranh giới phụ thuộc trong slice) + MVVM (màn hình) + composition/context (truyền dữ liệu).

> **Tóm gọn 1 câu:** Năm pattern không loại trừ nhau — chúng là các lớp khẩu trang khác nhau, đội lớp nào ở nơi nào đó đau thì đội lớp đó.
