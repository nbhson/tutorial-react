# DAY 15 — Hỏi & Đáp: Lifecycle & Effects

> File hỏi–đáp chi tiết cho `3_react-tutorial/15-lifecycle-effects`.
> Đọc kèm: `README.md` (lý thuyết) + `example.tsx` (clock + title chạy được).

---

## 1. `useEffect` là gì? Thay thế lifecycle nào của Angular?

**Hỏi:** Không có `ngOnInit/ngOnDestroy` thì code khởi tạo/dọn dẹp ở đâu?

**Đáp:**
- `useEffect(fn, deps)` chạy side effect **sau khi React đã vẽ (paint)** — để đồng bộ với hệ thống ngoài
  (timer, socket, DOM, subscription, `document.title`). Không có methods lifecycle; chỉ có effect chạy lại theo deps.
- Tương đương: mount 1 lần (`[]`) ≈ `ngOnInit`; cleanup `return () => {...}` ≈ `ngOnDestroy` + "gỡ cũ"
  trước lần chạy kế (gộp cả `ngOnChanges` dọn).
- Trong example: effect #1 (`[]`) tạo interval ≈ init + destroy; effect #2 (`[userId, now]`) set title mỗi khi
  user/giờ đổi ≈ changes theo 2 giá trị đó.

---

## 2. Deps quyết định gì? Bỏ deps thì sao?

**Hỏi:** Mảng deps cuối `useEffect` có bắt buộc không?

**Đáp:**
- **Bắt buộc về mặt tư duy** (kỹ thuật thì optional nhưng bỏ là sai 99%):
  - `[]` → chạy 1 lần sau mount.
  - `[userId, now]` → chạy lại mỗi khi một trong hai đổi (so bằng `Object.is`).
  - Không truyền → chạy sau **mọi** render — vừa tốn vừa dễ loop (effect setState → render → effect...).
- Deps là object/mảng tạo mới mỗi render → tham chiếu luôn khác → effect chạy lại vô ích. Fix: deps nguyên thủy,
  hoặc memo object, hoặc `useEffectEvent` (câu 5).

---

## 3. Cleanup là gì? Vì sao setup/cleanup phải đối xứng?

**Hỏi:** `return () => clearInterval(id)` trong effect để làm gì?

**Đáp:**
- Cleanup chạy **trước lần effect kế tiếp** (khi deps đổi) **và** khi unmount. Mọi setup phải có gỡ đối xứng:
  interval ↔ clear, socket ↔ close, listener ↔ remove, subscription ↔ unsubscribe.
- Thiếu cleanup: unmount rồi timer vẫn bắn `setState` (warning), socket rò rỉ, listener nhân đôi mỗi remount.
- StrictMode dev chạy setup → cleanup → setup cố tình để lộ thiếu cleanup: timer còn 1 (đúng) hay nhân đôi (sai)
  nhìn là biết. Prod chạy 1 lần — đừng bỏ StrictMode để "hết phiền".

---

## 4. `useLayoutEffect` khác `useEffect` ở đâu?

**Hỏi:** Hai hook này chọn thế nào?

**Đáp:**
- `useEffect`: chạy **sau paint** — mặc định cho mọi effect (fetch, sub, timer, title).
- `useLayoutEffect`: chạy **trước paint** — chỉ khi cần **đo DOM rồi set state ngay để tránh nháy**
  (tooltip position, scroll giữ vị trí). Chạy trước paint nên lạm dụng sẽ chặn vẽ → giật.
- Quy tắc: mặc định `useEffect`; thấy nháy một frame khi đo DOM mới đổi sang `useLayoutEffect`.

---

## 5. `useEffectEvent` (React 19.2+) giải quyết gì?

**Hỏi:** Effect phụ thuộc `roomId` nhưng handler cần `message` mới nhất — thêm `message` vào deps thì effect chạy lại liên tục?

**Đáp:**
- Đúng bẫy: deps phải đủ (lint `exhaustive-deps` bắt), nhưng thêm là chạy lại vô ích.
  `useEffectEvent` tách **logic không-reactive** ra khỏi deps: handler luôn đọc giá trị mới nhất
  mà effect không cần liệt kê nó — thay cho trick `eslint-disable` đầy rủi ro.
- Hiểu nôm na: "effect theo `roomId`, nhưng lúc chạy thì dùng `message` mới nhất".

---

## 6. Khi nào KHÔNG dùng effect? (Bẫy lớn nhất bài này)

**Hỏi:** Prop đổi thì gọi API, click thì chạy logic — viết effect được không?

**Đáp:**
- **Không.** Quy tắc 2026: effect chỉ cho **đồng bộ với hệ ngoài**. Còn lại:
  - Theo sự kiện user (click/submit) → **event handler**, không phải effect.
  - Tính dữ liệu từ props/state → **derived value** tính khi render (DAY 1), không effect + setState.
  - "Khi prop X đổi thì fetch" → thường là `useQuery` key theo X (DAY 12) hoặc handler, không phải effect fetch tay.
- Dấu hiệu sai: effect chỉ để `setState` từ props/state khác — vừa thừa render vừa dễ loop.

---

## 7. Stale closure trong effect là gì?

**Hỏi:** Interval đọc state cũ mãi không cập nhật?

**Đáp:**
- Effect đóng (closure) lên giá trị **lúc nó chạy**. Interval tạo 1 lần (`[]`) mà đọc `count` trực tiếp
  thì mãi là `count` lúc mount — gọi là stale closure.
- Fix trong example: `setNow(new Date())` không đọc state cũ (tạo mới hẳn) và `setTick((t) => t + 1)`
  dùng functional update — luôn nhận giá trị mới nhất. Hoặc đọc qua ref/`useEffectEvent`.

---

## Reference

- `README.md` + `example.tsx` trong cùng thư mục (DAY 15)
- https://react.dev/reference/react/useEffect · https://react.dev/reference/react/useLayoutEffect
- https://react.dev/learn/synchronizing-with-effects (khi nào (không) dùng effect)
