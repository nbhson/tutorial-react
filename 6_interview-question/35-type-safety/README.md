# Q35: Type đứt đoạn giữa form với API phải lạm dụng `as` — em làm sao để type đi xuyên suốt?

## Câu hỏi

> Nói là type safety xuyên suốt — từ Zod schema đến state, props, API —
> thì nó hoạt động cụ thể thế nào để chỉ viết type 1 lần?
> State fetch (idle/loading/success/error) nên dùng discriminated union hay 3 flag rời?
> Dấu `as` hay `as unknown as` thì bao giờ là smell, nên thay bằng gì?
> Exhaustive check (`never`) để làm gì? Hook generic và tuple `as const` (mô phỏng `useState`) thì sao?

## Trả lời ngắn (elevator pitch, 30 giây)

Mục này là "bản nói 30 giây" — chốt được khung 3 gạch đầu dòng là đã qua vòng loại; phần chi tiết bên dưới dùng để đỡ khi bị hỏi đào sâu.

- Viết type **một lần** ở Zod schema (runtime), suy ra type TS bằng `z.infer`, dùng xuyên suốt state/props/API. Đổi schema là mọi nơi theo.
- State máy (idle/loading/success/error) viết dạng union có nhãn thay vì 3 cờ rời: ở nhánh success thì `data` chắc chắn có, khỏi dấu `!`. Thêm check `never` để quên case nào là báo ngay.
- `as` là "bảo type system nhắm mắt": chỉ chấp nhận ở **biên** (đọc env/JSON từ ngoài vào, và phải qua Zod trước), càng vào sâu logic càng cấm.

## Trả lời chi tiết

Mục này lần lượt mở từng mảnh: "1 nguồn sự thật" hoạt động thế nào, state máy viết kiểu gì, và dấu `as` khi nào là tội — đọc để trả lời được câu "vì sao" thay vì chỉ liệt kê công cụ.

### 1. Type safety end-to-end — 1 nguồn sự thật (nói được = ăn điểm)

| Tầng | Làm gì | Nguồn type |
|---|---|---|
| **Schema** (Zod / openapi → gen) | **Runtime validate** (parse data không tin cậy) | `const Schema = z.object({...})` |
| **Type** | `type X = z.infer<typeof Schema>` | **Suy ra từ schema** (không viết lại) |
| **State / Props / API** | Dùng **type đó** (không "bản thứ 2") | `type User = z.infer<typeof UserSchema>` |
| **Test / Mock** | **Cùng type** (mock phải đúng shape) | Cùng 1 type |

> **Cách đọc bảng này:** mỗi dòng là một tầng của app; cột Nguồn type cho biết type ở tầng đó "sinh ra từ đâu" — đọc từ trên xuống để thấy cả 4 tầng cùng uống từ một nguồn duy nhất (schema), không tầng nào tự vẽ type riêng.

> **Vì sao "đắt giá"**: 1 schema = **1 type** (mọi tầng dùng lại). Đổi schema (thêm field) = **TS bắt mọi nơi "thiếu"** (prop, state, mock) — "an toàn" **tự động**, không "nhớ sửa 5 chỗ" (Q18: "zodResolver + z.infer"). Ví von: schema là "bản thiết kế gốc" — mọi tầng chỉ photocopy từ bản gốc chứ không ai tự vẽ lại; sửa bản gốc, mọi bản photocopy cũ lập tức "chéo lệch" và bị phát hiện.

### 2. Discriminated union (state máy) — vì sao "1 object" thay "3 flag"

> 📄 **Code ví dụ:** [`examples/01-2-discriminated-union-state-may-vi-sao-1.ts`](examples/01-2-discriminated-union-state-may-vi-sao-1.ts)

**Exhaustive check (đắt giá nhất)** — bắt "quên case mới":

> 📄 **Code ví dụ:** [`examples/02-2-discriminated-union-state-may-vi-sao-1.ts`](examples/02-2-discriminated-union-state-may-vi-sao-1.ts)

> **"Ăn điểm"**: thêm case mới (status: "pending") = **TS "báo"** — default không còn type `never`, **phải** xử lý case mới. Nếu dùng "flag rời", bạn **bỏ quên** case mới = **chạy sai về runtime** (không có cảnh báo). Ví von: 3 flag rời như 3 đồng đội mỗi người một tờ giấy nhớ — thêm trạng thái mới chẳng ai bắt cả ba đồng bộ; union có nhãn là một "bảng đèn máy ATM" — chỉ một đèn sáng mỗi lần, đèn nào sáng thì mọi dữ liệu đi kèm chắc chắn đúng khung.

### 3. `as` — "đánh lừa" type system (biết "sai khi nào" = ăn điểm)

- **`as T` / `as unknown as T`** = nói với TS "tôi biết, cho qua" — **không có kiểm tra** (lỗi type bị che). **Smell** khi dùng để **"đẩy code chạy"** (bỏ qua guard, cast `any`). Ví von: `as` như đóng dấu "hàng hợp lệ" lên kiện hàng mà chẳng mở ra soi — ai đóng dấu đều được qua cửa, dù bên trong là gì.
- **Đúng ở "biên" (borders)**: data không tin cậy (string env / `JSON.parse` / API raw / `localStorage`) → **Zod** (runtime) **parse rồi dùng `z.infer`** — **không cần `as`** (Q23: "validate ở biên, không rải rác").
- **Sai "trong" logic**: dùng `as` **để né guard** (if, union), hoặc đặt `any` vì **lười định nghĩa đúng** — **sai từ gốc** (mô hình type sai; sửa model, đừng đánh lừa).

> **Quy tắc 1 câu**: "`as` **chỉ** ở **biên (data không tin cậy)**, và dùng **Zod** thay `as` (parse + infer). **Trong** logic app: **không** `as` — nếu **phải** `as` = **type đang sai: sửa type**, đừng **cast**."

### 4. `z.infer` — nguồn của type (không viết 2 lần)

> 📄 **Code ví dụ:** [`examples/03-4-z-infer-nguon-cua-type-khong-viet.ts`](examples/03-4-z-infer-nguon-cua-type-khong-viet.ts)

> **Kết hợp Q18** (RHF + Zod + `z.infer`) **và Q23** (validate ở biên): **type = sản phẩm của schema** (1 nguồn), không phải **hình vẽ tay** (2 nguồn, **dễ lệch**).

### 5. Generic trong custom hook + tuple `as const` (Q16)

> 📄 **Code ví dụ:** [`examples/04-5-generic-trong-custom-hook-tuple-as-const.ts`](examples/04-5-generic-trong-custom-hook-tuple-as-const.ts)

> **`as const`** (không vi phạm rule "as"): giữ **tuple ổn định** (type `[T, setter]`, không **biến thành** `Array<T | setter>`). **Khác** `as` "đánh lừa" — đây là **củng cố type** (chống widening, **hợp lệ**, Q16 custom hook "tuple + as const").

## Bẫy khi phỏng vấn

Mục này là "bản đồ mìn": 6 câu trả lời nghe hợp lý nhưng sai — biết trước 6 chỗ ngập là không bao giờ chết máy giữa câu hỏi typing.

1. **Nói "as thì không sao, ai cũng viết"** → **sai**: `as` = **bỏ qua kiểm tra** (đánh lừa type). **Đúng**: ở biên dùng **Zod** (không `as`), **tránh** `as` trong logic (nếu "phải" `as` = type đang sai). Nói được "as = smell" là **điểm ăn điểm**.
2. **State máy dùng `status: string` (không union)** → mất **discriminate** (TS **không biết** "case nào"). Đúng: **union có discriminator** (`status: "idle" | "loading" | ...`) + **exhaustive** (`never`) (§2).
3. **Tự viết `interface` thủ công cho API (đi kèm Zod)** → **2 nguồn** (sai, dễ lệch). Đúng: **`z.infer`** từ schema (1 nguồn, §4).
4. **Cho rằng exhaustive check `never` chỉ là "trang trí"** → **sai**: đây là cái **đắt giá nhất** (bắt **case thiếu** khi **thêm** **mới**). **Đừng bỏ**.
5. **Cast `as` để "giải quyết" lỗi type (đẩy code chạy)** → **sai** (mô hình type sai). Đúng: **bổ sung guard / union / generic** (type đúng từ gốc), không **cast**.
6. **`useLocalStorage` trả tuple mà **không** `as const`** → **mất shape** (TS mở rộng thành `Array`), destructuring **sai type** (Q16).

> **Tóm gọn 1 câu:** Type đi xuyên suốt nhờ "một bản thiết kế gốc" (Zod schema) mà mọi tầng photocopy — chỗ nào gặp dữ liệu ngoài thì kiểm duyệt ở cửa, còn `as` dùng lung tung là đóng dấu giả.

## Gợi ý câu chốt

Mục này gói cả bài thành một đoạn trả lời mẫu — đọc để tập nói trọn một hơi rồi diễn đạt lại bằng giọng của mình.

> "Type safety end-to-end = **Zod schema (runtime) → `z.infer` (type) → state/props/API** — **1 nguồn sự thật** (đổi 1, mọi nơi tự cập nhật; Q18 '1 schema 1 type'). State máy dùng **discriminated union** (không 3 flag rời) + **exhaustive `never`** (bắt case thiếu). **`as` là smell** (đánh lừa type) — **đúng ở biên** (Zod thay vì cast, Q23 'validate ở biên'), **sai trong logic** (nếu phải `as` = type đang sai, sửa model, không cast). Generic cho hook (`useFetch<T>`), tuple **`as const`** (mô phỏng `useState`, Q16). 'Mỗi cast = 1 lần đánh lừa type system'."

## Reference

- [`3_react-tutorial/11-forms`](../../3_react-tutorial/11-forms) — Zod + `z.infer` (1 schema 1 type), `zodResolver`, "không viết type 2 lần"
- [`2_react-techniques/4_security-config/2-env-config`](../../2_react-techniques/4_security-config/2-env-config) — "validate ở biên" (Zod `.parse()` fail-fast, 1 nguồn sự thật env), "không secret trong bundle"
- [`3_react-tutorial/16-custom-hooks`](../../3_react-tutorial/16-custom-hooks) — custom hook (tuple, `as const`, "typing hook", generic `useFetch`)
- [`3_react-tutorial/8-external-store`](../../3_react-tutorial/8-external-store) — "typing selector" (getSnapshot reference, selector trả type ổn định)
- Q18 (RHF + Zod) — "zodResolver + z.infer" (1 schema 1 type), "as" smell (không cast trong logic)
- Q23 (bundle) — "validate ở biên, không rải rác" (nền cho "as ở biên")

## Câu hỏi liên quan

- **Hỏi tiếp (liên tục)**: [Q18 — Zod (zodResolver, z.infer) trong form?](../18-rhf-vs-controlled/README.md) · [Q35↔Q22 — "validate ở biên" (nền cho parse data không tin cậy)?](../22-interceptor/README.md)
- **Đào sâu (xuyên nhóm)**: [Q28 — typing reducer (discriminated union state machine)?](../28-usereducer-vs-usestate/README.md) · [Q36 — public API layer (typing xuyên tầng)?](../36-architecture-code-org/README.md)
