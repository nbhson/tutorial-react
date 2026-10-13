# Q35: Type đứt đoạn giữa form với API phải lạm dụng `as` — em làm sao để type đi xuyên suốt?

## Câu hỏi

> Nói là type safety xuyên suốt — từ Zod schema đến state, props, API —
> thì nó hoạt động cụ thể thế nào để chỉ viết type 1 lần?
> State fetch (idle/loading/success/error) nên dùng discriminated union hay 3 flag rời?
> Dấu `as` hay `as unknown as` thì bao giờ là smell, nên thay bằng gì?
> Exhaustive check (`never`) để làm gì? Hook generic và tuple `as const` (mô phỏng `useState`) thì sao?

## Trả lời ngắn (elevator pitch, 30 giây)

- **Type safety end-to-end** = type **không phải "hình" viết 2 lần** mà là **1 nguồn sự thật chạy xuyên stack**: **Zod schema (runtime) → `z.infer` (type) → state/props → API return**. Đổi 1 chỗ (schema), mọi nơi khác tự cập nhật (Q18: "1 schema = 1 type, không viết 2 lần").
- **Discriminated union cho state máy** (fetch: `idle | loading | success(data) | error(err)`) thay **3 flag rời** (`isLoading` + `data` + `error`): TS **biết "field nào có trong state nào"** — ở state `success`, `data` **luôn defined** (không `T | null`); ở `error`, `err` **luôn defined** → **exhaustive check** (`never`) bắt "quên case". Không union = phải `if (isLoading) ... else if (error) ... else data!` (dấu `!` = **đánh lừa type system** — bẫy).
- **`as` là smell** — "đánh lừa type system" (bỏ qua kiểm tra, tin "biết rồi"). **Đúng ở "biên"** (borders): parse từ **string không tin cậy** (env/API/`JSON.parse`) → **Zod (runtime) rồi `z.infer`** (không cần `as`); **sai "trong" logic** (bỏ qua guard, cast `any` để "đẩy code chạy"). Quy tắc: **`as` càng "sâu" vào app = càng nguy hiểm** (Q23: "validate ở biên, không rải rác").
- **Exhaustive check `never`**: trong `switch` của union, thêm `default: assertNever(x)` — **quên case mới = compile error** (đắt giá cho state máy).

## Trả lời chi tiết

### 1. Type safety end-to-end — 1 nguồn sự thật (nói được = ăn điểm)

| Tầng | Làm gì | Nguồn type |
|---|---|---|
| **Schema** (Zod / openapi → gen) | **Runtime validate** (parse data không tin cậy) | `const Schema = z.object({...})` |
| **Type** | `type X = z.infer<typeof Schema>` | **Suy ra từ schema** (không viết lại) |
| **State / Props / API** | Dùng **type đó** (không "bản thứ 2") | `type User = z.infer<typeof UserSchema>` |
| **Test / Mock** | **Cùng type** (mock phải đúng shape) | Cùng 1 type |

> **Vì sao "đắt giá"**: 1 schema = **1 type** (mọi tầng dùng lại). Đổi schema (thêm field) = **TS bắt mọi nơi "thiếu"** (prop, state, mock) — "an toàn" **tự động**, không "nhớ sửa 5 chỗ" (Q18: "zodResolver + z.infer").

### 2. Discriminated union (state máy) — vì sao "1 object" thay "3 flag"

```ts
// SAI: 3 flag rời (isLoading/data/error) — các trạng thái mâu thuẫn có thể tồn tại (loading mà có error?)
type State = { isLoading: boolean; data: User[] | null; error: string | null };
// render phải đoán tổ hợp nào hợp lệ — không có type nào "bảo" bạn

// ĐÚNG: discriminated union — mỗi state chỉ có đúng field của nó
type State =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: User[] }   // data chỉ có ở success, không phải null
  | { status: "error"; error: string };    // error chỉ có ở error
// TS narrow type theo status — mỗi case "biết" chính xác field nào hiện diện
```

**Exhaustive check (đắt giá nhất)** — bắt "quên case mới":

```ts
function renderState(s: State) {
  switch (s.status) {
    case "idle":    return <p>Ready</p>;
    case "loading": return <Spinner />;
    case "success": return <List data={s.data} />;   // s.data đảm bảo defined, không cần "!"
    case "error":   return <Alert msg={s.error} />;
    default: {
      const _exhaustive: never = s; // thêm state mới mà chưa xử lý → compile error ngay đây
      return _exhaustive;
    }
  }
}
```

> **"Ăn điểm"**: thêm case mới (status: "pending") = **TS "báo"** — default không còn type `never`, **phải** xử lý case mới. Nếu dùng "flag rời", bạn **bỏ quên** case mới = **chạy sai về runtime** (không có cảnh báo).

### 3. `as` — "đánh lừa" type system (biết "sai khi nào" = ăn điểm)

- **`as T` / `as unknown as T`** = nói với TS "tôi biết, cho qua" — **không có kiểm tra** (lỗi type bị che). **Smell** khi dùng để **"đẩy code chạy"** (bỏ qua guard, cast `any`).
- **Đúng ở "biên" (borders)**: data không tin cậy (string env / `JSON.parse` / API raw / `localStorage`) → **Zod** (runtime) **parse rồi dùng `z.infer`** — **không cần `as`** (Q23: "validate ở biên, không rải rác").
- **Sai "trong" logic**: dùng `as` **để né guard** (if, union), hoặc đặt `any` vì **lười định nghĩa đúng** — **sai từ gốc** (mô hình type sai; sửa model, đừng đánh lừa).

> **Quy tắc 1 câu**: "`as` **chỉ** ở **biên (data không tin cậy)**, và dùng **Zod** thay `as` (parse + infer). **Trong** logic app: **không** `as` — nếu **phải** `as` = **type đang sai: sửa type**, đừng **cast**."

### 4. `z.infer` — nguồn của type (không viết 2 lần)

```ts
// 1 schema -> 1 type (đổi 1 nơi, mọi chỗ dùng tự cập nhật)
const UserSchema = z.object({ id: z.string(), name: z.string() });
type User = z.infer<typeof UserSchema>; // type suy ra từ schema, không viết interface thứ 2

// API raw (string, không tin) -> parse (runtime) -> type đúng
const user: User = UserSchema.parse(rawJsonFromApi); // parse chặn shape sai ngay ở biên
```

> **Kết hợp Q18** (RHF + Zod + `z.infer`) **và Q23** (validate ở biên): **type = sản phẩm của schema** (1 nguồn), không phải **hình vẽ tay** (2 nguồn, **dễ lệch**).

### 5. Generic trong custom hook + tuple `as const` (Q16)

```ts
// (1) generic: hook nhận mọi kiểu data — type-safe cho mọi caller
function useFetch<T>(url: string): Promise<T> { /* ... */ }
const users = useFetch<User>("/api/users"); // mọi chỗ dùng đều đúng kiểu, không any chung

// (2) mô phỏng useState: trả tuple cố định, as const chống "mở rộng" mất type
function useLocalStorage<T>(key: string, initial: T): [T, (v: T) => void] {
  const [value, setValue] = useState<T>(initial);
  const save = (v: T) => { setValue(v); localStorage.setItem(key, JSON.stringify(v)); };
  return [value, save] as const; // tuple cố định [T, setter], không phải Array<T | Function>
}
```

> **`as const`** (không vi phạm rule "as"): giữ **tuple ổn định** (type `[T, setter]`, không **biến thành** `Array<T | setter>`). **Khác** `as` "đánh lừa" — đây là **củng cố type** (chống widening, **hợp lệ**, Q16 custom hook "tuple + as const").

## Bẫy khi phỏng vấn

1. **Nói "as thì không sao, ai cũng viết"** → **sai**: `as` = **bỏ qua kiểm tra** (đánh lừa type). **Đúng**: ở biên dùng **Zod** (không `as`), **tránh** `as` trong logic (nếu "phải" `as` = type đang sai). Nói được "as = smell" là **điểm ăn điểm**.
2. **State máy dùng `status: string` (không union)** → mất **discriminate** (TS **không biết** "case nào"). Đúng: **union có discriminator** (`status: "idle" | "loading" | ...`) + **exhaustive** (`never`) (§2).
3. **Tự viết `interface` thủ công cho API (đi kèm Zod)** → **2 nguồn** (sai, dễ lệch). Đúng: **`z.infer`** từ schema (1 nguồn, §4).
4. **Cho rằng exhaustive check `never` chỉ là "trang trí"** → **sai**: đây là cái **đắt giá nhất** (bắt **case thiếu** khi **thêm** **mới**). **Đừng bỏ**.
5. **Cast `as` để "giải quyết" lỗi type (đẩy code chạy)** → **sai** (mô hình type sai). Đúng: **bổ sung guard / union / generic** (type đúng từ gốc), không **cast**.
6. **`useLocalStorage` trả tuple mà **không** `as const`** → **mất shape** (TS mở rộng thành `Array`), destructuring **sai type** (Q16).

## Gợi ý câu chốt

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
