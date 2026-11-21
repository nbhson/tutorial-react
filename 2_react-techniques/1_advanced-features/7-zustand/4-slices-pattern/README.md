# Slices Pattern — Tổ chức store lớn

> Nguồn: https://zustand.docs.pmnd.rs/guides/slices-pattern

## Mục tiêu

Mục này nói về hai đích đến của bài: tách store lớn thành slice theo domain mà vẫn một store, và biết ranh giới tách hẳn store riêng. Đọc để biết bài giải bài toán nào.

- Tách store lớn thành slice theo domain (cart/ui/auth) mà vẫn là một store.
- Biết khi nào tách file, khi nào tách hẳn store riêng.

> **Tóm gọn 1 câu:** Slices pattern là "chung một ngôi nhà, mỗi phòng tự dọn" — store một, slice nhiều, mỗi domain gọn trong file mình.

## Khái niệm cốt lõi

Mục này nói về 5 khái niệm của slices pattern — đọc để hiểu cách chia phòng trong "ngôi nhà" store.

- **Slices pattern**: mỗi domain là hàm `(set, get) => sliceState`; store chính spread gộp: `create<State>()((...a) => ({ ...cartSlice(...a), ...uiSlice(...a) }))` — một store, nhiều file. Ví von: mỗi slice là một phòng tự bài trí, store chính chỉ việc ghép bản vẽ các phòng lại thành một ngôi nhà.
- **Một store vs nhiều store**: chung store thì action liên domain dễ (checkout đọc cart + auth), DevTools một chỗ. Tách store khi domain độc lập hẳn (vd editor canvas nặng tách khỏi app shell để tránh re-render chéo) — như tách riêng xưởng ồn ào ra khỏi ngôi nhà để tiếng máy không làm cả nhà mất ngủ.
- **Type gộp**: `type State = CartSlice & UiSlice` — mỗi file export type slice của mình, store gộp bằng intersection.
- **Slice giao tiếp qua `get()`**: action cart đọc `get().user` thay vì import store user — tránh import vòng. Ví von: các phòng trao đổi qua sảnh chung (store), không phải đục tường thông riêng (import chéo).
- **Đặt tên selector theo domain**: `useCart`, `useUi` là 2 hook cùng trỏ một store — component không biết (không cần biết) chúng chung gốc.

> **Tóm gọn 1 câu:** Mỗi domain một slice file, store gộp bằng spread, type gộp bằng `&`, và slice nói chuyện với nhau qua `get()` chứ không import chéo.

## Ví dụ chi tiết

Mục này nói về code hoàn chỉnh của bài — đọc song song phần giải thích dưới.

> 📄 **Code ví dụ:** [`examples/01-vi-du-chi-tiet.tsx`](examples/01-vi-du-chi-tiet.tsx)

## Giải thích từng phần

Mục này nói về từng chi tiết kỹ thuật trong ví dụ — những chỗ dễ gõ sai generic.

- `StateCreator<State, [], [], CartSlice>`: 4 generic (state gốc, middleware đã dùng, ..., slice trả về) — không middleware thì giữa để `[]`; có persist/devtools thì khai báo tuple tương ứng.
- `(...a)` truyền `set/get/api` xuống mọi slice — slice nào cũng đủ đồ nghề như store độc lập.
- Hook domain (`useCartItems`) là lớp đặt tên — người đọc code biết component thuộc domain nào, refactor tách store sau không vỡ component.
- Middleware (persist/devtools bài 3) bọc `create` ngoài cùng — slice không biết middleware tồn tại, như nhân viên phòng không cần biết ai lắp camera hành lang.

## Lỗi thường gặp

Mục này nói về 4 bẫy khi tổ chức store lớn — đọc để không tách quá sớm hay quá muộn.

- **Một file store 500 dòng** → merge conflict, khó tìm. Fix: tách slice khi file > ~150 dòng hoặc có 2 domain rõ rệt.
- **Slice import nhau trực tiếp** (`cartSlice` import `uiSlice`) → import vòng. Fix: giao tiếp qua `get()` trong action.
- **Tách store quá sớm** (3 store cho app 3 màn hình) → đồng bộ liên store phức tạp hơn lợi ích. Fix: một store + slice trước, tách khi đo thấy re-render chéo thật.
- **Quên type middleware trong `StateCreator`** → lỗi type khó đọc khi thêm persist. Fix: khai báo tuple middleware đúng docs slices-pattern.

> **Tóm gọn 1 câu:** Tách slice theo dấu hiệu thực (file dài, 2 domain), đừng tách store khi chưa "đau" thật, và giao tiếp slice luôn qua `get()`.

## Reference

- [Slices pattern](https://zustand.docs.pmnd.rs/guides/slices-pattern)
