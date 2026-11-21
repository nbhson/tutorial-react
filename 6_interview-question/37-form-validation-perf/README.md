# Q37: Form mấy chục ô, vừa gõ vừa validate từng ô mà không lag, em làm thế nào?

## Câu hỏi

> Form 15–20 field, muốn validate từng field khi user gõ (email, password, confirm, tên, họ, ...) mà UI không được lag.
> Viết bằng `useState` + tự check hợp lệ sau mỗi keystroke thì có gì vấn đề? Dùng `react-hook-form` + `zod` thì khác chỗ nào, và khi nào thì tự viết vẫn hợp lý hơn?

## Trả lời ngắn (elevator pitch, 30 giây)

Mục này là "bản nói 30 giây" — trả lời được khung 3 gạch đầu dòng là đã chứng minh tư duy perf; phần chi tiết bên dưới để đỡ khi bị hỏi đào.

- Tự viết `useState` + validate trong lúc render: mỗi phím gõ là vẽ lại **cả form + chạy lại toàn bộ rule** → 20 ô là lag.
- RHF + Zod: state form nằm ngoài React, gõ không vẽ lại; `register` không bind value; schema chạy một lần (debounce khi `mode: 'onChange'`).
- Form dưới 5 ô không check chéo thì tự viết + Zod check tay vẫn hợp lý. Form chéo/động/nhiều section thì RHF.

## Trả lời chi tiết

Mục này lần lượt giải thích vì sao validate mỗi keystroke là chết, rồi xếp hạng 3–4 cách làm (tự viết, RHF+Zod, Actions) theo hoàn cảnh — đọc để chọn đúng thuốc cho đúng bệnh.

### 1. Vì sao "validate cả form mỗi keystroke" chết

> 📄 **Code ví dụ:** [`examples/01-1-vi-sao-validate-ca-form-moi-keystroke.tsx`](examples/01-1-vi-sao-validate-ca-form-moi-keystroke.tsx)

Mỗi keystroke = **1 re-render form** + **chạy lại validation N field** (O(N) per keystroke → O(N×keys) tổng). **`react-hook-form` đảo ngược**: form state là **ref ngoài React**, React không re-render form khi gõ (đọc value qua `register` + internal ref, chỉ re-render "ô bị validate"). Ví von: tự validate mỗi keystroke giống như mỗi lần bạn viết thêm một chữ trong sổ, cả văn phòng phải đọc lại từ trang 1 để soi lỗi; RHF là mỗi người tự giữ trang của mình — ai sai thì chỉ trang đó được gọi đến.

### 2. `react-hook-form` + `zod` (combo chuẩn 2026)

> 📄 **Code ví dụ:** [`examples/02-2-react-hook-form-zod-combo-chuan-2026.tsx`](examples/02-2-react-hook-form-zod-combo-chuan-2026.tsx)

**Điểm ăn điểm**: `zodResolver` + `refine` (cross-field) là 1 nguồn (Q18, Q35) — không "viết regex email 2 lần" (1 ở validation, 1 ở type).

### 3. So sánh 3 cách (quyết định)

| Cách | Khi nào | Vì sao |
|---|---|---|
| `useState` + tự validate (manual) | Form **< 5 field**, không cross-field | Ít code, hiểu hết — không cần lib |
| `react-hook-form` (no resolver) | Form có **dynamic fields** (add/remove), không cần schema nghiêm | Lib nhẹ, "khéo tay" |
| **`react-hook-form` + `zod` (resolver)** | Form **nghiêm túc** (cross-field, type-safe, API nhận cùng schema) | 1 schema = 1 type + 1 validate (Q35, Q18) — **chuẩn** |

> **Cách đọc bảng này:** mỗi dòng là một cách viết form xếp từ nhẹ nhất đến nghiêm túc nhất; cột "Khi nào" là cột quyết định — dò đúng dòng khớp với form của bạn, đừng chọn dòng "chuẩn nhất" cho mọi trường hợp.

**Q19 (bẫy kinh điển)**: "form thì luôn RHF" → **sai** (form 3 field thì `useState` đủ, thêm lib = overhead "nghi thức").

### 4. React 19 form Actions: validate ở server, hành vi async "miễn phí"

React 19 đưa form vào luồng **Actions**: `<form action={fn}>` — `fn` chạy (client handler hoặc Server Action), React quản `pending`/reset/retry; **validation có thể nằm ở server** mà form vẫn hiện lỗi ngay. Combo với `useActionState` + Zod chạy **cùng 1 schema ở cả 2 phía**:

> 📄 **Code ví dụ:** [`examples/03-4-react-19-form-actions-validate-o-server.tsx`](examples/03-4-react-19-form-actions-validate-o-server.tsx)

> 📄 **Code ví dụ:** [`examples/04-4-react-19-form-actions-validate-o-server.tsx`](examples/04-4-react-19-form-actions-validate-o-server.tsx)

**Vì sao không lag?** Input là **uncontrolled** (không `value`/`onChange` per keystroke) ⇒ gõ 0 re-render form; validate chạy **1 lần khi submit** ở server. Đây chính là hướng "perf" thứ ba cạnh RHF: state trong FormData (browser native), không nằm trong React. Ví von: input controlled là bạn liên lạc từng chữ với quầy bằng loa mỗi khi gõ; input uncontrolled là viết trọn phiếu rồi đưa qua quầy một lần lúc submit — quầy (server) mới là người kiểm phiếu.

**So với RHF + Zod client-side:**

| | RHF + Zod (client validate) | React 19 Actions (server validate) |
|---|---|---|
| Re-render khi gõ | 0 (ref-based) | 0 (uncontrolled + FormData) |
| Nguồn rule | Zod 1 chỗ, chạy client | Zod 1 chỗ, chạy **server** (client không giữ logic) |
| Chống bypass | Không — user tắt JS/đổi request là qua | Có — rule nằm server, luôn chạy |
| Progressive enhancement | Không (cần JS) | Có — form chạy cả khi JS chưa load |
| Cộng đồng/thư viện (autocomplete, dynamic fields) | RHF dày hơn | Vẫn thô hơn — form phức tạp UX nhiều thì RHF dễ sống hơn |

> **Cách đọc bảng này:** mỗi dòng là một tiêu chí so sánh hai hướng; cột giữa là RHF + Zod validate ở client, cột phải là React 19 Actions validate ở server — các dòng "Chống bypass" và "Progressive enhancement" là hai điểm chỉ Actions có, còn dòng cuối là lý do RHF chưa chịu biến mất.

**Quyết định thực chiến (2026):** form CRUD / login → Actions + `useActionState` (đơn giản, an toàn, ít dep); form phức tạp nhiều tương tác client (wizard, dynamic rows, autosave) → RHF + Zod; validate nghiêm túc thì **luôn validate lại ở server** dù client đã check.

### 5. `useOptimistic` cho validate "trước" + `useFormStatus` cho nút submit

> 📄 **Code ví dụ:** [`examples/05-5-useoptimistic-cho-validate-truoc-useformstatus-cho-nut.tsx`](examples/05-5-useoptimistic-cho-validate-truoc-useformstatus-cho-nut.tsx)

- **`useFormStatus`** đọc trạng thái `<form>` cha qua Context ẩn của React — component nút không cần nhận prop `pending` (chi tiết ở DAY 22 của `3_react-tutorial`).
- **`useOptimistic`** — với mutation inline (thêm item vào list), hiện kết quả kỳ vọng ngay, server từ chối thì rollback. Cặp đôi này thay thế phần lớn "loading state + disable nút" viết tay trước 19.

### 6. Ví dụ tổng hợp: form bình luận dùng Actions end-to-end

> 📄 **Code ví dụ:** [`examples/06-6-vi-du-tong-hop-form-binh-luan.tsx`](examples/06-6-vi-du-tong-hop-form-binh-luan.tsx)

> 📄 **Code ví dụ:** [`examples/07-6-vi-du-tong-hop-form-binh-luan.tsx`](examples/07-6-vi-du-tong-hop-form-binh-luan.tsx)

Điểm cần chỉ ra khi phỏng vấn:

- **Zod 1 nguồn 2 nơi**: cùng schema validate client (nếu cần live) và server (bắt buộc) — không trùng logic (Q35).
- **`revalidatePath`** — server quyết định data nào stale; client không tự refetch tay.
- **`role="alert"`** — lỗi validate phải tới được screen reader (Q42).
- **`formRef.reset()`** — action thành công mới reset; reset trước khi biết kết quả là bẫy kinh điển của form async.

### 7. Bảng tổng hợp 4 cách viết form (2026)

| Cách | Re-render khi gõ | Validate ở đâu | Dùng khi |
|---|---|---|---|
| Controlled `useState` | Mỗi phím | Client (tay) | < 5 field, không cross-field |
| RHF + Zod | 0 (ref-based) | Client (schema) | Form tương tác nặng, dynamic fields |
| React 19 Actions (`useActionState`) | 0 (uncontrolled) | **Server** (schema) | CRUD/login/mutation, cần chống bypass |
| Actions + RHF hybrid | 0 | Client live + server re-check | Enterprise: UX live + an toàn server |

> **Cách đọc bảng này:** mỗi dòng là một cách viết form; đọc cột "Re-render khi gõ" để hiểu mức perf, cột "Validate ở đâu" để hiểu mức an toàn, và cột "Dùng khi" là kết luận — dòng cuối (hybrid) là đáp án cho app lớn khi không muốn hy sinh UX lẫn an toàn.

Không có "cách đúng duy nhất" — có **ranh giới đúng**: mọi đường đều phải re-validate ở server; client validate chỉ là UX.

> **Tóm gọn 1 câu:** Đừng bắt cả form trả bài sau mỗi phím gõ — để state ở ngoài React (RHF) hoặc trao phiếu một lần cho server (Actions), và dù client validate đến đâu thì server vẫn phải kiểm lại lần cuối.

## Bẫy khi phỏng vấn

Mục này là "bản đồ mìn": 7 câu trả lời nghe hợp lý nhưng sai — biết trước 7 chỗ ngập là câu hỏi form nào cũng đi được.

1. **"Validate cả form mỗi keystroke bằng `useState`"** → lag (Q17), RHF "tránh" bằng form state ngoài React (không re-render).
2. **"Zod thì chỉ cho type, không validate runtime"** → **sai** (Q18, Q35) — `zod` = schema runtime + `z.infer` (1 nguồn 2 mục đích).
3. **"`criteriaMode: 'firstError'` = chỉ validate ô đầu tiên"** → **sai** (chỉ **hiển thị** lỗi đầu tiên, validate cả form vẫn chạy — UX đỡ "nổ đỏ").
4. **"Cross-field (password/confirm) bằng `watch` mỗi ô"** → **sai** (bằng `refine` trên `zod`, chạy 1 lần, "1 nguồn").
5. **"React 19 Actions thay RHF hoàn toàn"** → **chưa đúng**: Actions lo mutation + validate server rất tốt, nhưng form tương tác nặng (dynamic fields, autosave, wizard) vẫn hợp RHF; và validate server **bổ sung** client validate, không thay thế.
6. **"Action throw Error là cách trả lỗi validation"** → **sai**: throw là lỗi hệ thống; validation error phải **trả về state** qua `useActionState` để form hiện cạnh field, không sập boundary.
7. **"Đặt `value` + `onChange` lên input trong form dùng action"** → tự biến uncontrolled thành controlled, mất lợi ích 0 re-render; để uncontrolled (`name` + `defaultValue`) và đọc qua FormData.

> **Tóm gọn 1 câu:** Bẫy lớn nhất là tin "client validate rồi thì khỏi cần server" — mọi validation phía client chỉ là lịch sự, server mới là người kiểm duyệt cuối cùng.

## Gợi ý câu chốt

Mục này gói cả bài thành một đoạn trả lời mẫu — đọc để tập nói trọn một hơi rồi diễn đạt lại bằng giọng của mình.

> "Form N field: tự viết `useState` re-render form mỗi keystroke (Q17). **RHF + zod** = form state ngoài React (ref, không re-render) + `zodResolver` (validate 1 lần, `refine` cross-field, `z.infer` type = 1 nguồn — Q18, Q35). `mode: 'onChange'` + `criteriaMode: 'firstError'` = validate khi gõ, show 1 lỗi. Từ React 19 có thêm **Actions**: `<form action>` + `useActionState` + validate Zod **ở server** — input uncontrolled nên gõ 0 re-render, chống bypass, progressive enhancement; nút dùng `useFormStatus` đọc pending. **Quyết định (Q19)**: form < 5 field → tự viết; tương tác nặng → RHF+zod; CRUD/login → Actions; validation nghiêm túc luôn re-check server."

## Reference

- [`18-rhf-vs-controlled`](../18-rhf-vs-controlled/README.md) — "Vì sao nên dùng react-hook-form thay vì useState", `zodResolver`, `getValues`
- [`19-when-usestate-when-rhf`](../19-when-usestate-when-rhf/README.md) — "Khi nào useState, khi nào RHF/Zod"
- [`35-type-safety`](../35-type-safety/README.md) — "1 Zod schema = 1 type + 1 runtime check" (`z.infer`)
- [`17-controlled-form`](../17-controlled-form/README.md) — "Controlled form: state + event", "tại sao re-render mỗi keystroke"
- [React 19 — Actions & useActionState (react.dev)](https://react.dev/blog/2024/12/05/react-19)
- [`useActionState` reference](https://react.dev/reference/react/useActionState) · [`useFormStatus` reference](https://react.dev/reference/react-dom/hooks/useFormStatus)
- [`4_react-new-feature/2_react-19`](../../4_react-new-feature/2_react-19/README.md) — Actions demo trong tutorial
- [`3_react-tutorial/22-form-status`](../../3_react-tutorial/22-form-status/README.md) — `useFormStatus` + `useActionState` kết hợp thực hành
## Câu hỏi liên quan

- **Hỏi tiếp (liên tục)**: [Q18 — vì sao RHF thay vì controlled?](../18-rhf-vs-controlled/README.md) · [Q19 — khi nào useState, khi nào RHF?](../19-when-usestate-when-rhf/README.md)
- **Đào sâu (xuyên nhóm)**: [Q35 — Zod 1 nguồn type+validate?](../35-type-safety/README.md) · [Q16 — form re-render nhiều, memo giúp gì?](../16-memo/README.md)
