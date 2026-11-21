# Q9: Hai component con cùng cần dùng chung một state, em đặt state ở đâu?

## Câu hỏi

> Hai component anh em cùng cần đọc/đổi một dữ liệu (ví dụ nút Plus/Minus cùng một count) thì mình đặt state ở đâu?
> Vì sao đưa lên cha chung gần nhất thay vì cứ lên đến root?
> Nếu cần chia sẻ qua 5-10 tầng thì lifting state còn đủ không, nên chuyển sang gì? So với Angular thì xử lý kiểu gì?

## Trả lời ngắn (elevator pitch, 30 giây)

Mục này là câu trả lời 30 giây — chốt cả ba vế: đặt đâu, vì sao không lên root, sâu quá thì làm sao.

- Hai con cùng cần một dữ liệu thì **đưa state lên ông cha chung gần nhất**: con nhận qua props, muốn đổi thì gọi callback cha đưa xuống. Ví von: như gia đình có **một sổ tiết kiệm** giữ ở tủ nhà cha mẹ — con nào cần thì "đề nghị rút", không ai tự chép sổ riêng (hai sổ = hai nguồn sự thật = cãi nhau). Một nơi giữ sự thật duy nhất.
- Đừng đẩy lên tận root: state càng cao, mỗi lần đổi càng nhiều component vẽ lại. Đặt vừa đủ cao để các con cần nó đều với tới.
- Cần chia sẻ qua 5–10 tầng hoặc nhiều chỗ không họ hàng thì hết đất lifting — chuyển Context/store.

> **Tóm gọn 1 câu:** Lifting = đưa state lên "ông tổ chung gần nhất" — một nguồn sự thật, props xuống, callback lên; sâu quá thì chuyển Context/store.

## Trả lời chi tiết

### 1. Vấn đề "hai con, mỗi đứa một state riêng"

> 📄 **Code ví dụ:** [`examples/01-1-van-e-hai-con-moi-ua-mot.tsx`](examples/01-1-van-e-hai-con-moi-ua-mot.tsx)

Hai state **riêng rẽ** = **hai nguồn sự thật** → bug "state không đồng bộ" (Plus "cộng" nhưng Minus "không giảm" cùng count). Cách sửa: **đưa state lên App (cha chung)**, con nhận giá trị + callback.

### 2. Pattern chuẩn (lifting)

> 📄 **Code ví dụ:** [`examples/02-2-pattern-chuan-lifting.tsx`](examples/02-2-pattern-chuan-lifting.tsx)

Cơ chế (một chiều xuống + một chiều lên):

```
Dữ liệu:      state (cha)  ──props──▶  con (chỉ đọc, không đổi)
Sự kiện:      con ──callback──▶  cha (cha "quyết định" đổi state)
```

- **Con không biết cha xử lý ra sao** — con chỉ gọi đúng contract (tên + payload). Ví dụ `onAdd(5)`: con "đề nghị" cộng 5, **cha** có thể cộng, log, chặn (nếu vượt `max`...). **Quyết định cuối luôn ở cha** — con không "ép" cha.
- **Payload nên là "dữ liệu con biết"** (số, text, cờ) mà không phải event thô (`React.MouseEvent`) — type đơn giản, dễ test (gọi `onAdd(5)` trực tiếp, không cần mock DOM).

### 3. "Dấu hiệu" (heuristic) — khi nào "phải" lifting

Mục này cho 3 "thuốc thử" nhận biết khi nào bắt buộc lifting — gặp một trong ba dấu hiệu là state phải lên cha chung.

Trả lời câu "Khi nào phải đưa state lên cha?" với **3 dấu hiệu**:

| Dấu hiệu | Ví dụ | Không lifting → hậu quả |
|---|---|---|
| **Hai "anh em" cần cùng dữ liệu** | `<Plus/>` + `<Minus/>` cùng count; `<Filter/>` + `<List/>` cùng `query` | state "lệch" (2 nguồn sự thật) |
| **Cha cần đọc giá trị con đang giữ** | Form: `<TextInput value={name}/>` mà `name` ở App (cha validate/hiển thị tên) | Con "giữ" → cha không thấy (prop không "đổi ngược") |
| **Sự kiện con A phải đổi giao diện con B** | `<TextInput/>` gõ → `<Preview/>` (anh em) cập nhật | Hai con "không nói chuyện được" nếu không chung cha |

> **Cách đọc bảng này:** cột "Dấu hiệu" là tình huống bạn đang gặp, cột "Không lifting → hậu quả" là giá phải trả nếu để state ở con — dò theo tình huống của mình để quyết định.

> **Quy tắc thực chiến**: nếu hai component **không là cha–con của nhau** và **cùng cần một dữ liệu** → **state phải ở "cha chung gần nhất"**.

### 4. "Đưa lên cao nhất (root) luôn" — KHÔNG (đây là "bẫy")

Mục này chặn trước phản xạ "đưa lên root cho chắc" — giải thích vì sao đặt cao thừa là tự làm khó mình, và khi nào thì chuyển hẳn sang Context/store.

- **Đặt cao quá** (root) khi chỉ cần "hai anh em trong một section":
  - **Re-render lan rộng**: mỗi lần state đổi, **cả app** re-render (mặc định React không "chặn" con re-render khi props đổi — xem [`10-memo-format`](../../3_react-tutorial/10-memo-format)).
  - **Không "nói rõ" intent**: state ở root nhưng chỉ dùng trong 1 section → code "đẩy" dữ liệu không cần thiết lên cao (vi phạm "đặt cao nhất *cần*").
- **Quy tắc đúng**: **cha chung *gần nhất*** (closest common ancestor). Ví dụ: 2 anh em trong `<CartSection/>` → state ở `CartSection`, không phải App.
- **Nâng cấp khi "quá cao" không đủ**: khi cần **chia sẻ sâu/rộng** (5–10+ tầng, hoặc nhiều cây con không là "anh em") → **Context** (DAY 7) hoặc **store** (Zustand/Redux — DAY 8). Context/store **không thay thế** "single source of truth", mà **mở rộng** phạm vi "nơi state được chia sẻ" mà không "prop-drilling".

### 5. Đối chiếu Angular (điểm "ăn điểm")

| React | Angular (cùng vấn đề) |
|---|---|
| Lifting state up (cha giữ state, con nhận **props**) | **State ở component "cha"**, con nhận `@Input()`; con "báo" qua `@Output()`/`EventEmitter` (one-way binding xuống + sự kiện lên) |
| "Hai anh em cần cùng dữ liệu" → đưa lên "cha chung gần nhất" | Angular "cùng vấn đề" (hai component `@Input` "lệch" nếu không có "service" hoặc "cha" giữ state) |
| Context (DAY 7) / Store (DAY 8) khi "nhiều tầng" | **`@Injectable` service** (chia sẻ một instance) hoặc **Ngrx/Zustand** (khi tree sâu) |

> Điểm khác **cơ bản**: Angular có **DI container** (service "một instance" tự nhiên) — React **không có DI** (chỉ Context/store "tự viết" chia sẻ) — vì React là **library**, không phải framework full (xem [`01-library-vs-framework`](../01-library-vs-framework/README.md)).

## Bẫy khi phỏng vấn

Mục này là 5 bẫy khi trả lời về lifting — bẫy số 2 ("đưa lên root cho chắc") và số 4 (nhầm lifting với prop-drilling sâu) là hai chỗ interviewer hay vặn.

1. **"State 'luôn' ở component con (gần nơi 'dùng')"** (nói suông) → **sai**: đúng "khi chỉ con cần". Nhưng **hai anh em** hoặc **cha cần đọc** → **bắt buộc** lifting (xem "dấu hiệu" ở §3).
2. **"Đưa lên root 'cho chắc'"** → **sai** (re-render lan, không "nói rõ" intent). Quy tắc "đặt cao nhất *cần*", không phải "cao nhất *có thể*".
3. **Con "tự đổi" state cha truyền vào (gán `props.value = ...`)** → **sai** (props là **read-only** — mỗi render cha tạo object props mới, gán con "chỉ sửa" snapshot cục bộ, render sau "nhảy về"). Fix: **báo cha qua callback**, cha đổi state, props mới "chảy xuống".
4. **Nhầm "lifting" với "prop-drilling sâu"** → lifting là "đưa lên cha *chung gần nhất*", không phải "đưa lên root". Nếu "đi qua" 4–5 tầng mà chỉ "một giá trị" → **chuyển sang Context/store**, không "kéo" state quá cao.
5. **Truyền "event thô" (MouseEvent) làm payload** → con "nên" truyền **dữ liệu** (số, text, cờ), không phải event (type đơn giản, dễ test).

## Gợi ý câu chốt

> "Lifting state up là 'đưa `useState` lên cha chung gần nhất' khi nhiều component cần đọc/đổi cùng một dữ liệu — con nhận **props** (một chiều xuống), báo **callback** (một chiều lên), state là **single source of truth**. Dấu hiệu phải lifting: hai 'anh em' cần cùng dữ liệu, cha cần đọc giá trị con đang giữ, hoặc sự kiện con A phải đổi giao diện con B. **Không** đưa lên root 'cho chắc' — chỉ 'cha chung *gần nhất*'. Khi tree sâu/rộng (5+ tầng, nhiều cây con không là 'anh em') → chuyển sang **Context** (DAY 7) hoặc **store** (DAY 8), không 'kéo state lên root' vô hạn."

## Reference

- [`3_react-tutorial/3-props-interaction`](../../3_react-tutorial/3-props-interaction) — "Lifting state up" (mục 4), callback event, payload
- [`3_react-tutorial/7-context-basic`](../../3_react-tutorial/7-context-basic) — Context khi "nhiều tầng"
- [`3_react-tutorial/8-external-store`](../../3_react-tutorial/8-external-store) — Store (Zustand/Redux) khi "rộng"
- Q1 (Library vs Framework) — vì sao React "không có DI" (Angular có, React không)
- [`10-memo-format`](../../3_react-tutorial/10-memo-format) — re-render khi props đổi (vì sao "đặt cao quá" = "re-render lan")

## Câu hỏi liên quan

- **Hỏi tiếp (liên tục)**: [Q13 — prop drilling quá sâu thì chuyển Context khi nào?](../13-context-vs-props/README.md) · [Q28 — state nhiều chỗ phụ thuộc nhau, chuyển useReducer?](../28-usereducer-vs-usestate/README.md)
- **Đào sâu (xuyên nhóm)**: [Q15 — state chung nhiều feature (Redux/Zustand)?](../15-external-stores/README.md) · [Q36 — khi nào thì context/store không đủ, cần kiến trúc layer?](../36-architecture-code-org/README.md)
