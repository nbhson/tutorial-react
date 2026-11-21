# DAY 16 — Hỏi & Đáp: Custom hooks

> File hỏi–đáp chi tiết cho `3_react-tutorial/16-custom-hooks`.
> Đọc kèm: `README.md` (lý thuyết) + `example.tsx` (`useLocalStorage` + `useFetch` chạy được).

---

## 1. Custom hook là gì? Có gì "thần bí" không?

**Hỏi:** `useLocalStorage`/`useFetch` là API mới của React à?

**Đáp:**
- **Không có gì thần bí** — custom hook chỉ là **function tên `use*` gọi hook khác bên trong**.
  React cho phép nó dùng hook vì nó tuân quy tắc hooks; bản thân nó chỉ là hàm chia sẻ logic.
- Trong example: `useLocalStorage` = `useState` + `localStorage`; `useFetch` = `useState` + `useEffect` + `fetch`.
  Không có syntax đặc biệt nào ngoài cái tên `use` đầu.
- Ví von: hook là "công thức nấu" — chia sẻ được công thức cho mọi nhà, nhưng nồi canh (state)
  ở mỗi nhà mỗi kiểu.

> **Tóm gọn 1 câu:** Custom hook không thần bí — chỉ là hàm tên `use*` gọi hook khác bên trong để gom logic tái sử dụng.

---

## 2. Ba quy tắc hooks là gì? Vì sao hook cấm trong `if`?

**Hỏi:** `if (cond) useState(...)` báo lỗi gì?

**Đáp:**
1. Chỉ gọi ở **top-level** component/hook (không trong `if`/loop/hàm con).
2. Tên bắt đầu bằng `use`. 3. Chỉ gọi trong component function hoặc hook khác.
- Lý do: React phân biệt state các lần gọi hook bằng **thứ tự gọi**, không bằng tên biến.
  Gọi có điều kiện → số lượng/thứ tự hook đổi giữa các render → state gán nhầm cho nhau.
- Hook chạy lại **mỗi render** (nó là hàm) — state giữ được là nhờ thứ tự ổn định, không phải nhờ tên.
- Ví von: rules of hooks như ghế ngồi có số — React nhớ "hook lần 1 ngồi ghế 1", không nhớ tên ai;
  gọi có điều kiện là đổi số ghế giữa chừng, người ngồi nhầm ghế.

> **Tóm gọn 1 câu:** React nhớ state theo thứ tự gọi hook, không theo tên biến — nên hook cấm trong `if`/loop, phải top-level.

---

## 3. Custom hook khác Angular Service ở điểm nào? (Bẫy singleton)

**Hỏi:** `useLocalStorage("name")` ở 50 component thì chung một giá trị à?

**Đáp:**
- **Không — mỗi nơi state riêng.** Service Angular là class **singleton** (logic + state dùng chung).
  Custom hook là hàm logic — **state nằm ở component gọi nó**. 50 component gọi = 50 state độc lập,
  không tự đồng bộ (trừ storage event thủ công).
- Muốn **chia sẻ state** thật → Context (DAY 7) hoặc store (DAY 8). Đây là trục khác biệt quan trọng nhất —
  nhầm là thiết kế sai kiến trúc (tưởng share mà hóa ra mỗi nơi một bản).
- Ví von: Service là một két sắt chung cả công ty; hook là bản in hướng dẫn mở két — ai cũng có bản
  hướng dẫn, nhưng két vẫn một cái.

> **Tóm gọn 1 câu:** Hook chia sẻ logic, không chia sẻ state — muốn state chung thật thì hook mỏng đọc store/context.

---

## 4. Lazy initializer `useState(() => ...)` để làm gì?

**Hỏi:** Sao `useLocalStorage` không viết `useState(localStorage.getItem(key) ?? initial)`?

**Đáp:**
- Không bọc hàm thì `localStorage.getItem` **chạy mỗi render** (dù kết quả chỉ dùng lần đầu) — tốn + có thể
  throw ở SSR. Bọc `() => ...` thì React chỉ gọi **1 lần duy nhất** lúc mount (lazy).
- Quy tắc: giá trị khởi tạo **đắt hoặc có side-effect** (đọc storage, parse JSON lớn, `new` object nặng)
  thì luôn dùng lazy initializer.

> **Tóm gọn 1 câu:** Bọc `() => ...` để React chỉ đọc giá trị khởi tạo 1 lần lúc mount — tránh chạy việc đắt tiền mỗi render.

---

## 5. `useFetch` tự viết đủ cho prod chưa?

**Hỏi:** Có `useFetch` generic rồi, cần gì TanStack Query?

**Đáp:**
- **Chưa đủ.** `useFetch` example thiếu cache, retry, dedupe, background refetch, stale — viết đủ rất dễ sai.
  Nó chỉ đúng vai trò **bài học** (hiểu `useEffect` + AbortController + generic `<T>`).
- Prod cần các tính năng trên → TanStack Query (DAY 12). Nhớ pattern: hook tự viết để học/tách logic,
  managed lib để làm prod.
- Ví von: tự viết `useFetch` như tự nướng bánh để học nghề — giỏi nghề rồi thì mở tiệm (prod) cứ mua
  lò công nghiệp (TanStack Query) mà dùng, không ai nướng nghìn cái/ngày bằng tay.

> **Tóm gọn 1 câu:** `useFetch` tự viết là bài học, chưa phải giải pháp prod — prod cần cache/retry/dedupe thì dùng TanStack Query.

---

## 6. Khi nào tách custom hook? Dấu hiệu component cần tách?

**Hỏi:** Logic nào cũng lôi ra hook à?

**Đáp:**
- Tách khi: dùng ở **≥2 nơi**; component **>150 dòng** vì gom state/effect; muốn **test logic độc lập**
  (`renderHook`) khỏi UI.
- Không tách: logic chỉ dùng 1 lần và ngắn — tách sớm thành nhiều file nhỏ khó theo dõi hơn.
- Ranh giới với store/Query: hook tách **logic**, store/Query tách **state dùng chung** — hook không thay store.
- Ví von: tách hook như gói gia vị dùng lại — chỉ gói thứ nêm nhiều món; muối chỉ dùng cho một món
  thì cứ để trong bếp, gói mười gói nhỏ còn rối hơn.

> **Tóm gọn 1 câu:** Tách hook khi logic dùng từ 2 nơi trở lên, component quá dài, hoặc cần test logic độc lập — không tách cho có.

---

## 7. Viết `useDebounce` cho ô search: cleanup `clearTimeout` hoạt động thế nào?

**Hỏi:** Muốn ngừng gõ 300ms mới gọi API — hook này chạy ra sao từng bước?

**Đáp:**
- Cơ chế: `useDebounce(value, delay)` giữ `debounced` (giá trị "đã chốt"), mỗi lần `value` đổi thì effect cũ **cleanup** (`clearTimeout` hủy hẹn cũ) rồi hẹn timeout mới. Chỉ khi user ngừng gõ đủ `delay`, timeout sống sót tới lúc chạy `setDebounced(value)` — API gọi bằng `debounced` nên không bắn mỗi phím.
- Vì sao cleanup là linh hồn: không có `return () => clearTimeout(id)` thì mỗi phím một timeout, gõ 10 ký tự bắn 10 request trễ khác nhau — kết quả về lộn xộn (race). Cleanup đảm bảo **tại một thời điểm chỉ có 1 hẹn sống**.
- Sai thì sao: quên `[value, delay]` deps thì effect không chạy lại khi gõ, `debounced` đứng yên. Fix: deps đủ, component gọi API bằng `debounced` chứ không phải `value` thô.

> **Tóm gọn 1 câu:** Cleanup `clearTimeout` hủy hẹn cũ mỗi lần `value` đổi — nhờ đó chỉ phím gõ cuối cùng mới chạm tới API.

> 📄 **Code ví dụ:** [`examples/01-7-viet-usedebounce-cho-o-search-cleanup-cleartimeout.tsx`](examples/01-7-viet-usedebounce-cho-o-search-cleanup-cleartimeout.tsx)

---

## 8. Đồng bộ giữa các tab: `useLocalStorage` + sự kiện `storage` và `useOnlineStatus`?

**Hỏi:** Mở 2 tab cùng app, tab A đổi tên thì tab B có tự đổi không? Mất mạng thì sao?

**Đáp:**
- Mặc định **không** — mỗi tab một state hook riêng (bẫy singleton câu 3). Muốn đồng bộ phải nghe sự kiện `storage` của trình duyệt (fire ở các tab khác khi một tab `setItem`), rồi `setValue` lại. Đây là cầu giữa "state riêng mỗi hook" và "storage chung trình duyệt".
- Cơ chế `useOnlineStatus`: nghe cặp sự kiện `online`/`offline` của `window`, state `online` đổi theo mạng thật. Dùng để disable nút Lưu, hiện banner "đang offline" — UX quan trọng hơn nhiều người nghĩ.
- Cả hai hook đều phải **cleanup listener** khi unmount, nếu không chuyển trang nhiều lần là listener chồng đống (rò rỉ + setState sau unmount). Đây là lý do "mọi setup trong hook trả cleanup" (README pitfalls).
- Ví von: listener không cleanup như rời phòng mà quên tắt chuông cửa — cứ mỗi lần qua phòng là thêm
  một chuông kêu, cuối cùng cả hành lang ùm ùm.

> **Tóm gọn 1 câu:** Tab không tự đồng bộ — phải nghe sự kiện `storage`/`online` và luôn trả cleanup listener khi unmount.

> 📄 **Code ví dụ:** [`examples/02-8-ong-bo-giua-cac-tab-uselocalstorage-su.tsx`](examples/02-8-ong-bo-giua-cac-tab-uselocalstorage-su.tsx)

---

## 9. Trả object hay tuple? Khi nào `{ data, loading, error, refetch }` thắng `[value, set]`?

**Hỏi:** `useLocalStorage` trả tuple, `useFetch` nâng cấp trả gì cho dễ dùng?

**Đáp:**
- Quy tắc: **2 giá trị quen thuộc** (`value` + setter như `useState`) thì trả tuple `[value, save]` — nơi dùng bung tên tùy ý, thứ tự nhớ được. **Từ 3 giá trị trở lên** hoặc có field optional thì trả **object** — đọc `data.loading` rõ hơn nhớ `r[1]`, thêm field mới không vỡ thứ tự ở nơi dùng cũ.
- Cơ chế nâng `useFetch` thành `useFetchWithState`: thêm `loading` (đang chờ), `error` (lỗi mạng/parse), `refetch` (tải lại) — đúng 4 thứ component cần để vẽ skeleton/lỗi/nút thử lại. Tuple 4 phần tử là không đọc nổi, object là bắt buộc.
- Sai thì sao: trả tuple 4 phần tử, nơi dùng `const [d, l, e, r] = useFetch(...)` — thêm field thứ 5 là sửa mọi nơi bung. Fix: object + type rõ, thêm field không vỡ.

> **Tóm gọn 1 câu:** 2 giá trị quen thuộc trả tuple, từ 3 giá trị trở lên trả object — thêm field mới không vỡ nơi dùng cũ.

| Hook trả | Dạng trả | Ví dụ |
|---|---|---|
| 2 giá trị, thứ tự quen (`value`, setter) | Tuple + `as const` | `useLocalStorage`, `useToggle` |
| ≥3 giá trị hoặc có optional | Object tên rõ | `{ data, loading, error, refetch }` |
| Thêm field sau này | Object không vỡ nơi dùng cũ | Tuple vỡ thứ tự bung |

> **Cách đọc bảng này:** mỗi dòng là một tình huống trả về của hook — cột 2 gợi ý dùng tuple hay object, cột 3 cho ví dụ thật. Quy tắc ngắn: 2 giá trị quen thì tuple, từ 3 trở lên thì object.

---

## 10. Test hook độc lập bằng `renderHook` (nhá DAY 21) thế nào?

**Hỏi:** `useDebounce` không có UI thì test kiểu gì, có cần render component giả không?

**Đáp:**
- Không cần component giả — RTL cung cấp `renderHook(() => useDebounce("a", 300))` mount hook trong component test vô hình, trả `result.current` để assert. Logic test độc lập khỏi UI, đúng ranh giới "hook tách logic" (câu 6).
- Cơ chế với timer: `useDebounce` dùng `setTimeout` thật thì test chờ 300ms thật — chậm + flaky. Dùng `vi.useFakeTimers()`, `act(() => vi.advanceTimersByTime(300))` tua nhanh, assert `result.current` đã chốt. Nhớ `vi.useRealTimers()` sau để không ảnh hưởng test khác.
- Sai thì sao: assert `result.current` ngay sau render mà không tua timer thì vẫn giá trị cũ — tưởng hook sai. Fix: tua timer trong `act`, rồi mới assert.

> **Tóm gọn 1 câu:** `renderHook` test hook không cần UI; có timer thật thì dùng fake timers + `act` tua nhanh rồi mới assert.

> 📄 **Code ví dụ:** [`examples/03-10-test-hook-oc-lap-bang-renderhook-nha.tsx`](examples/03-10-test-hook-oc-lap-bang-renderhook-nha.tsx)

---

## 11. Lỗi thực chiến: gọi hook từ hàm thường + đặt tên không `use` thì sao?

**Hỏi:** `function helper() { useState(); }` và `function myFetch() { useEffect(); }` có chạy không?

**Đáp:**
- **Cả hai đều sai.** Gọi hook từ hàm thường (không phải component/hook) thì React không gắn state vào đúng fiber — báo "Invalid hook call" lúc runtime. Linter (`eslint-plugin-react-hooks`) cũng không nhận diện được vì tên không bắt đầu `use`, nên không cảnh báo sớm về thứ tự/deps — mất cả lưới an toàn tĩnh lẫn đúng runtime.
- Cơ chế linter: plugin quét các hàm tên `use*` và thân component để check "top-level + deps". Đặt tên `myFetch` chứa hook mà không `use` đầu là "tàng hình" trước linter — sai thứ tự trong đó không ai báo, bug chỉ lộ khi user đi đúng nhánh render.
- Fix: mọi hàm chứa hook phải tên `use*` (`useFetch`, `useOnlineStatus`) và chỉ gọi trong component/hook khác. Hàm thuần không chứa hook thì để ở `utils/` (không `use` đầu để khỏi nhầm).
- Ví von: tên `use` đầu như đồng phục nhân viên — quản lý (React + linter) chỉ soát người có đồng phục;
  mặc thường phục (hàm thường) mà làm việc của nhân viên là cả hệ thống không ai kiểm soát nổi.

> **Tóm gọn 1 câu:** Hàm chứa hook phải tên `use*` và chỉ gọi trong component/hook khác — gọi từ hàm thường là lỗi runtime + linter mù.

> 📄 **Code ví dụ:** [`examples/04-11-loi-thuc-chien-goi-hook-tu-ham.tsx`](examples/04-11-loi-thuc-chien-goi-hook-tu-ham.tsx)

---

## Reference

- `README.md` + `example.tsx` trong cùng thư mục (DAY 16)
- https://react.dev/learn/reusing-logic-with-custom-hooks
- https://react.dev/reference/react (rules of hooks)
