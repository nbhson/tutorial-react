# Bản đồ các `use*` trong repo — phân biệt & gom nhóm

> Trong repo này có ~80 tên bắt đầu bằng `use`, nhưng chỉ ~25 là hook **thật**
> (React built-in + thư viện). Phần còn lại là **custom hook** — hàm do mình
> (hoặc tài liệu mẫu) đặt tên theo quy ước `use*`.
> **Quy tắc nhận diện:** tên bắt đầu bằng `use` + gọi ít nhất một hook khác
> bên trong → là hook, chịu Rules of Hooks (chỉ gọi ở top-level component/hook).

> **Cách đọc bảng này (áp dụng cho cả file):** mỗi nhóm là một "tủ đồ nghề", mỗi bảng là một tủ — đọc cột "Khi nào dùng" trước để tìm nhanh món cần, rồi mới xem cột "Việc gì" để hiểu nó làm gì. Cuối mỗi nhóm có đoạn **Phân biệt** để tránh nhầm hàng giả.

## Nhóm 1 — State cục bộ (nhớ giá trị qua các render)

| Hook | Nguồn | Việc gì | Khi nào dùng |
|---|---|---|---|
| `useState` | React | State đơn giản: `[value, set]` | Form field, toggle, counter (DAY 11, Q&A 11) |
| `useReducer` | React | State phức tạp: `dispatch({type})` → reducer thuần | Nhiều field liên quan, state machine nhỏ |
| `useOptimistic` | React 19 | State "đoán trước" khi chờ server (tự rollback nếu lỗi) | Like/comment hiện ngay trước khi server trả lời |

**Phân biệt:** `useState` đủ cho 90% case. `useReducer` khi nhiều `setState`
rời rạc cập nhật cùng lúc hoặc logic chuyển trạng thái cần test độc lập.
`useOptimistic` không thay `useState` — nó là lớp phủ tạm thời trên dữ liệu server.

> **Tóm gọn 1 câu:** Nhóm này là "sổ tay ghi chú cá nhân" của component: `useState` cho ghi chú đơn, `useReducer` cho sổ nhiều trang ràng buộc nhau, `useOptimistic` cho ghi chú phỏng đoán chờ xác nhận.

## Nhóm 2 — Ref & "lối thoát" khỏi render

| Hook | Nguồn | Việc gì | Khi nào dùng |
|---|---|---|---|
| `useRef` | React | Hộp `{ current }` ổn định, đổi **không re-render** | DOM node, id, timeout, giá trị "nhớ mà không hiện" (DAY 4) |
| `useImperativeHandle` | React | Con chọn lộ API gì qua ref cha truyền xuống (kèm `forwardRef`) | `inputRef.focus()` có kiểm soát — dùng khiêm tốn |
| `useId` | React | Sinh id duy nhất, ổn định SSR/client | `label htmlFor`, `aria-describedby` — **không** dùng làm key list |

**Phân biệt:** cần **hiện lên màn hình** → state (Nhóm 1); chỉ cần **giữ để dùng**
→ ref. `useId` sinh id cho a11y, còn key của list phải từ dữ liệu (id backend).

> **Tóm gọn 1 câu:** Nhóm này là "tủ đồ cá nhân để sau cánh gà": ref giữ đồ không ai nhìn thấy, `useImperativeHandle` quyết định cho mượn món nào, `useId` phát thẻ tên không trùng.

## Nhóm 3 — Effect (đồng bộ với "thế giới ngoài React")

| Hook | Nguồn | Việc gì | Khi nào dùng |
|---|---|---|---|
| `useEffect` | React | Chạy **sau paint**: fetch, sub, timer, DOM đo đạc | Mặc định cho mọi side effect (DAY 15) |
| `useLayoutEffect` | React | Chạy **trước paint**: đo DOM rồi set state liền | Tooltip/caret — tránh nháy 1 frame |
| `useInsertionEffect` | React | Chạy trước cả layout effect, chỉ cho CSS-in-JS inject style | Không dùng tay — dành cho tác giả thư viện CSS |
| `useEffectEvent` (R19.2+) | React | Tách logic "đọc giá trị mới nhất" ra khỏi deps | Thay `eslint-disable exhaustive-deps` |

**Phân biệt:** mặc định `useEffect`. Chỉ lên `useLayoutEffect` khi thấy nháy.
`useInsertionEffect` không phải bản "mạnh hơn" của layout effect — sai chỗ là lỗi.

> **Tóm gọn 1 câu:** Nhóm này là "đội giao hàng với thế giới ngoài": `useEffect` giao sau khi nhà vẽ xong, `useLayoutEffect` giao trước khi khách nhìn thấy — sai thời điểm là lộ khuyết điểm.

## Nhóm 4 — Hiệu năng (cache / hoãn render)

| Hook | Nguồn | Việc gì | Khi nào dùng |
|---|---|---|---|
| `useMemo` | React | Cache **giá trị tính toán** nặng theo deps | Filter/sort list lớn, object options ổn định |
| `useCallback` | React | Cache **hàm** theo deps (trường hợp của `useMemo` cho function) | Prop callback cho con `memo`, deps của effect khác |
| `useDeferredValue` | React | Trì hoãn **giá trị** không khẩn (giữ UI cũ khi gõ filter) | Ô tìm kiếm + list lớn (kết hợp `memo` item) |
| `useTransition` | React | Đánh dấu **update** không khẩn (`startTransition`, `isPending`) | Chuyển tab/filter nặng không block input |

**Phân biệt:** `useMemo`/`useCallback` = **đỡ tính lại**; `useDeferredValue`/
`useTransition` = **đỡ block UI** (concurrent). Deferred cho *giá trị*,
Transition cho *hành động update*. React Compiler 1.0 (2026) tự memo phần lớn —
không bọc tay mọi thứ (DAY 10, Q&A 10 mục 8).

> **Tóm gọn 1 câu:** Nhóm này là "cửa hàng tiết kiệm": `useMemo`/`useCallback` trữ đồ dùng sẵn (đỡ tính lại), `useDeferredValue`/`useTransition` xếp hàng đợi khách vãng lai (đỡ chặn khách quan trọng).

## Nhóm 5 — Đọc dữ liệu React đang giữ (Context / Router / i18n)

| Hook | Nguồn | Việc gì | Khi nào dùng |
|---|---|---|---|
| `useContext` | React | Đọc giá trị `Context` gần nhất | Theme/auth/locale xuyên tầng (DAY 7) |
| `use` | React 19 | Đọc Context **hoặc Promise** (dùng được trong if/loop) | Component client chờ promise với Suspense |
| `useParams` | React Router | Tham số động `:id` của route | Trang chi tiết `/posts/:id` (project 5) |
| `useSearchParams` | React Router | Query string `?q=...` (đọc + set) | Filter/tab sync lên URL |
| `useNavigate` | React Router | Điều hướng bằng code | Sau submit → về list; guard redirect |
| `useLocation` | React Router | Vị trí hiện tại (`pathname`, state) | Highlight nav, "quay lại trang trước" |
| `useLoaderData` | React Router | Dữ liệu `loader` chạy **trước render** | Trang cần data sẵn, ít skeleton (DAY 14) |
| `useRouteLoaderData` | React Router | Đọc loader của **route khác** (theo id) | Layout cần data của route con |
| `useNavigation` | React Router | Trạng thái điều hướng (`idle`/`loading`) | Loading bar toàn cục khi chuyển trang |
| `useTranslation` | react-i18next | `t(key)` + `i18n.changeLanguage` runtime | Mọi chuỗi hiển thị (DAY 18) |

**Phân biệt:** `useParams` = phần của **path** (`/posts/3`); `useSearchParams` =
phần sau **?** (`?q=abc`). `useLoaderData` = data có **trước** render (ít chờ);
`useQuery` (Nhóm 6) = fetch **trong** component (nhiều kiểm soát cache hơn).

> **Tóm gọn 1 câu:** Nhóm này là "hộp thư và bản đồ": Context/i18n là thông báo nội bộ, Router hooks là bản đồ + trạm dừng — đọc đúng chỗ (path hay `?`) mới lấy đúng thứ.

## Nhóm 6 — Server state: fetch & mutation

| Hook | Nguồn | Việc gì | Khi nào dùng |
|---|---|---|---|
| `useQuery` | TanStack Query | GET có cache: `queryKey` + `queryFn`, dedupe, retry, refetch nền | Mọi GET prod (DAY 12, project 5) |
| `useInfiniteQuery` | TanStack Query | GET phân trang vô hạn (`fetchNextPage`) | Feed "tải thêm", scroll vô hạn |
| `useMutation` | TanStack Query | POST/PUT/DELETE + `onSuccess: invalidateQueries` | Mọi thay đổi dữ liệu (project 5) |
| `useQueryClient` | TanStack Query | Truy cập cache trực tiếp (`setQueryData`, `invalidateQueries`) | Mirror API fake, optimistic update tay |
| `useActionState` | React 19 | State + `isPending` của **Server Action** (Next.js) | Form validate ở server |
| `useFormStatus` | React DOM | Đọc pending của `<form action>` gần nhất | Nút Submit của form server (phải nằm trong form) |

**Phân biệt:** đọc → `useQuery`; ghi → `useMutation`; can thiệp cache tay →
`useQueryClient`. `useActionState`/`useFormStatus` chỉ cho Server Actions/Next.js —
SPA thuần (Vite) dùng Query + RHF.

> **Tóm gọn 1 câu:** Server state có "quản gia riêng": `useQuery` đi mua (GET có cache), `useMutation` đi trả/gửi, `useActionState`/`useFormStatus` chỉ phục vụ bàn bếp Next.js.

## Nhóm 7 — Form client (react-hook-form)

| Hook | Nguồn | Việc gì | Khi nào dùng |
|---|---|---|---|
| `useForm` | RHF | Đăng ký field uncontrolled, `handleSubmit`, `reset`, `formState` | Mọi form >3 field hoặc cần validate (DAY 11) |
| `useFieldArray` | RHF | List field động (thêm/xóa dòng) | "Thêm dòng sản phẩm", nhiều địa chỉ |
| `useFormState` | RHF | Đọc `formState` (errors, isSubmitting) ở component con lẻ | Tách `SubmitButton`/`ErrorList` riêng khỏi `useForm` |
| `watch` | RHF | Theo dõi giá trị field để render theo (không phải hook `use*` nhưng hay nhầm) | Preview live, hiện/ẩn field theo lựa chọn |

**Phân biệt:** `useForm` = bộ não; `useFieldArray` = mảng động; `useFormState` =
đọc state form từ xa. Validate schema (Zod) đi kèm qua `zodResolver`, không viết
validate tay trong RHF.

> **Tóm gọn 1 câu:** RHF là "hộp giấy tờ form": `useForm` giữ hồ sơ chính, `useFieldArray` quản dòng động, `useFormState` là bản photo cho component ở xa — validate cứ giao cho Zod.

## Nhóm 8 — External store (state ngoài React)

| Hook | Nguồn | Việc gì | Khi nào dùng |
|---|---|---|---|
| `useSyncExternalStore` | React | Nền tảng: `subscribe` + `getSnapshot`, an toàn concurrent/tearing | Viết store thủ công tương thích StrictMode/SSR |
| `useStore` / `useSelector` | Zustand / Redux | Đọc slice store ngoài (`Object.is` so sánh) | `useCart`, `useCartStore` (DAY 8) |
| `useShallow` | Zustand | So sánh nông selector object/mảng | Selector trả object mà không muốn re-render thừa |

**Phân biệt:** thực chiến dùng **Zustand** (`create()` + selector), không gọi
`useSyncExternalStore` trực tiếp trừ khi viết lib. Selector phải trả tham chiếu
ổn định — `.filter`/object literal trong selector là re-render vô hạn (Q&A 8).

> **Tóm gọn 1 câu:** Nhóm này là "két sảnh chung": `useSyncExternalStore` là bản vẽ kỹ thuật của két, Zustand/Redux là két bán sẵn — muốn két riêng mới tháo bản vẽ ra tự hàn.

## Nhóm 9 — Thư viện UI/hành vi (nhận diện theo package)

| Hook | Nguồn | Việc gì |
|---|---|---|
| `useSortable` | dnd-kit | Kéo-thả sắp xếp: trả `attributes`, `listeners`, `setNodeRef`, `transform` (DAY 20) |
| `useVirtualizer` | TanStack Virtual | Chỉ render dòng đang nhìn thấy trong list khổng lồ |
| `useReducedMotion` | framer-motion | Đọc `prefers-reduced-motion` — tắt animation cho ai cần (DAY 19) |
| `useMediaQuery` | custom (DAY 16) | `matchMedia` + state — responsive theo breakpoint thật |
| `useProfiler` | React (dev) | Đo thời gian render thực tế của cây con |

> **Cách đọc bảng này:** nhóm này tra cứu theo **package** (cột Nguồn) chứ không theo tên hook — gặp hook lạ trong code, nhìn cột Nguồn để biết nó đến từ thư viện nào rồi mới đọc docs của thư viện đó.

## Nhóm 10 — Custom hook tự viết trong repo (mẫu để học theo)

| Hook | Ở đâu | Gói logic gì |
|---|---|---|
| `useLocalStorage` | DAY 16 | `useState` lazy + `useEffect` ghi storage — state persist |
| `useDebounce` | DAY 16 | `useState` + `useEffect` cleanup timeout — search/filter |
| `useOnlineStatus` | DAY 16 | `addEventListener` online/offline + cleanup — banner mất mạng |
| `usePrevious` | Q&A 16 | ref cập nhật trong effect — so sánh giá trị trước/sau |
| `useToggle` | techniques style-guide | boolean + flip — mẫu hook 3 dòng |
| `useTheme` / `useAuth` | DAY 7 / techniques auth | `useContext` + throw khi ngoài Provider — guard scope |
| `usePosts` / `usePost` / `useCreatePost` / `useUpdatePost` / `useDeletePost` | project 5 | `useQuery`/`useMutation` + `useQueryClient` — CRUD hoàn chỉnh |
| `useCounterViewModel` / `useLoginViewModel` | techniques MVVM | Gom state + logic màn hình — ViewModel bằng hook |
| `useWorker` | techniques perf | Web Worker + `useEffect` lifecycle — tính nặng ngoài main thread |

> **Cách đọc bảng này:** đây là "các bài văn mẫu" trong repo — khi cần viết custom hook, đọc bản cùng tính chất ở bảng này trước (persist → `useLocalStorage`, debounce → `useDebounce`, guard scope → `useTheme`) thay vì viết lại từ đầu.

## Cặp dễ nhầm nhất — tra cứu nhanh

| Cặp | Khác nhau một câu |
|---|---|
| `useState` vs `useRef` | State đổi → **re-render**; ref đổi → **im lặng** (DAY 4) |
| `useState` vs `useReducer` | Ít field độc lập → state; nhiều chuyển đổi liên quan → reducer |
| `useEffect` vs `useLayoutEffect` | Sau paint (mặc định) vs trước paint (chống nháy đo DOM) |
| `useMemo` vs `useCallback` | Cache **giá trị** vs cache **hàm** |
| `useDeferredValue` vs `useTransition` | Hoãn **giá trị** vs hoãn **lần update** |
| `useContext` vs props | Xuyên tầng config (theme/auth) vs cha-con rõ ràng (DAY 7, Q&A 3) |
| `useQuery` vs `useEffect`+fetch | Cache/dedupe/retry tự động vs tự lo mọi thứ (DAY 12) |
| `useQuery` vs `useLoaderData` | Fetch trong component vs data sẵn trước render |
| `useParams` vs `useSearchParams` | `:id` trong path vs `?key=` sau dấu hỏi |
| `useForm` vs `useState` cho form | >3 field/cần validate → RHF; 1–2 field → state (DAY 11) |
| `useActionState` vs `useMutation` | Server Action (Next.js) vs mutation SPA thuần |
| `useSyncExternalStore` vs Zustand | Viết store tay vs dùng lib (lib đã bọc sẵn nó) |

> **Cách đọc bảng này:** đây là bảng "tra cứu nhanh khi nghi ngờ" — khi phân vân giữa 2 hook, tìm cặp trong bảng và đọc câu ở cột phải; mỗi câu là một phép thử phân biệt trong ~10 từ.

## Cây quyết định — "cần gì → chạm gì"

Mục này là "thang máy nhanh" của cả file: trả lời đúng câu "mình cần gì" là biết phải chạm vào hook nào — đọc từ trên xuống theo đúng thứ tự câu hỏi mình tự hỏi khi code.
1. **Nhớ giá trị để hiển thị** → `useState` (phức tạp → `useReducer`).
2. **Giữ giá trị/DOM mà không render** → `useRef`.
3. **Đồng bộ với ngoài React** (API, timer, socket, DOM) → `useEffect` (+ cleanup).
4. **Tính nặng / render nặng** → `useMemo` + `memo`; **input lag vì list lớn** → `useDeferredValue`.
5. **Dữ liệu xuyên tầng ít đổi** → Context + `useContext`; **đổi liên tục nhiều nơi** → Zustand store.
6. **GET prod** → `useQuery`; **POST/PUT/DELETE** → `useMutation`.
7. **Form nghiêm túc** → `useForm` + Zod; **2 ô đơn giản** → `useState`.
8. **Logic dùng ở ≥2 chỗ** → tách custom hook `use*` (DAY 16), test bằng `renderHook`.
9. **Hook của lib lạ** → đọc theo package (dnd-kit, TanStack, i18next), đừng đoán theo tên.

> **Tóm gọn 1 câu:** Bản đồ hook cả repo: ~25 hook thật chia thành 10 tủ đồ — cần gì, mở đúng tủ; phân vân thì tra bảng "cặp dễ nhầm" và cây quyết định ở cuối.

## Reference

- Chi tiết từng DAY: README trong `0-react-explore/` → `21-testing-e2e/`
- Hỏi-đáp thực chiến: `question-answer.md` mỗi DAY + `GLOSSARY.md`
- CRUD tổng hợp: `../5_react-crud-jsonplaceholder/` (`usePosts`, `useMutation`, `useQueryClient`)
- Tài liệu gốc: [react.dev — Built-in Hooks](https://react.dev/reference/react/hooks),
  [TanStack Query](https://tanstack.com/query/latest),
  [React Hook Form](https://react-hook-form.com/),
  [Zustand](https://zustand.docs.pmnd.rs/)
