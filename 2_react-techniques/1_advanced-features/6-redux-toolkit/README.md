# Redux Toolkit — Mini-track chi tiết

> Nguồn: https://redux-toolkit.js.org/ · Đọc trước: [bài 3](../3-store-zustand-tanstack-query/README.md) (khi nào cần Redux thay vì Zustand).

## Mục tiêu track

Mục này nói về những gì cả mini-track mang lại: học từng mảnh RTK tách bạch và biết chọn Redux hay không. Đọc để xem lộ trình trước khi bắt đầu.

- Làm chủ từng mảnh Redux Toolkit (RTK) riêng lẻ thay vì học dồn: slice → async → chuẩn hóa → fetch → debug/persist.
- Cuối track dựng được store app lớn: nhiều slice + thunk + entity adapter + RTK Query + DevTools time-travel.
- Biết **khi nào chọn Redux thay vì Zustand** — và khi nào Redux là thừa.

> **Tóm gọn 1 câu:** Track này dạy bạn "đóng từng bộ phận của chiếc xe" rồi mới lắp lên — và quan trọng hơn: biết khi nào bạn cần xe, khi nào xe đạp là đủ.

## Bản đồ khái niệm

Mục này nói về 5 bài trong track và vai trò từng bài. Đọc bảng để định vị mình đang ở đâu trong hành trình.

| # | Thư mục | Khái niệm | Khi nào dùng |
|---|---|---|---|
| 1 | [1-slice-store/](1-slice-store/README.md) | `createSlice`, `configureStore`, `Provider`, typed hooks, Immer | Mọi app Redux — nền bắt buộc |
| 2 | [2-async-thunk/](2-async-thunk/README.md) | `createAsyncThunk`, `extraReducers`, mẫu `status`/`error` | Mọi gọi API đưa vào store |
| 3 | [3-entity-adapter/](3-entity-adapter/README.md) | `createEntityAdapter`, chuẩn hóa `{ids, entities}` | Collection cần update/xóa từng item |
| 4 | [4-rtk-query/](4-rtk-query/README.md) | `createApi`, tags, hook tự sinh | App đã có Redux và muốn fetch hợp nhất |
| 5 | [5-devtools-persist/](5-devtools-persist/README.md) | DevTools time-travel, `serializableCheck`, persist, listener | Debug + giữ state qua reload |

> **Cách đọc bảng này:** mỗi dòng là một bài theo đúng thứ tự nên đọc (từ 1 đến 5); cột "Khái niệm" cho biết bài dạy gì, cột "Khi nào dùng" trả lời câu hỏi "bài này có dành cho app của mình không" — nếu cả 5 ô bên phải đều không đúng với bạn, có thể bạn chưa cần Redux.

## Thứ tự đọc gợi ý

```
1 (slice) → 2 (thunk) → 3 (adapter) → 4 (rtk-query) → 5 (devtools)
```

Lý do từng bước:

- **`1` là nền không thể bỏ** — mọi bài sau đều viết slice, nên phải thuộc `createSlice`/`configureStore` trước đã. Typing (`RootState`, `useAppDispatch`) cũng cài ở đây một lần dùng suốt track.
- **`2` xử lý async cho slice ở bài 1** — thunk trả promise (`pending`/`fulfilled`/`rejected`), bắt bằng `extraReducers` của chính slice bài 1. Học xong bài này bạn không còn lý do nào viết fetch trong component.
- **`3` chuẩn hóa collection mà bài 2 fetch về** — list bài viết/user trâu bò cần update/xóa từng item theo `id`; adapter cho sẵn CRUD reducer + selector, khỏi viết tay.
- **`4` là nhánh thay thế bài 2+3 cho fetch** — đọc để biết chọn, không bắt buộc dùng ngay. Quy tắc: server cache → RTK Query; client state → slice thường.
- **`5` là công cụ dùng suốt quá trình** — DevTools xem action/time-travel từ bài 1; persist + listener middleware gom về đây cho gọn.

> **Tóm gọn 1 câu:** Đọc 1 → 2 → 3 → 4 → 5 như xây nhà: móng (slice), điện nước (thunk), nội thất (adapter), đường ống chung (RTK Query), và hệ camera an ninh (DevTools).

## Khi nào dùng Redux Toolkit — khi nào không

Mục này nói về bài toán lựa chọn quan trọng nhất của track: Redux đáng giá khi nào và là gánh nặng khi nào. Đọc trước khi quyết định kéo Redux vào dự án.

**Chọn Redux Toolkit khi:**

- App lớn, nhiều team, cần **một nguồn state duy nhất** có DevTools time-travel để debug chéo.
- Cần **middleware phức tạp**: listener middleware (side-effect tập trung), saga-style flow, undo/redo.
- Đã có hạ tầng Redux cũ (codebase doanh nghiệp) — RTK là cách hiện đại hóa mà không viết lại.
- Muốn **RTK Query**: cache server data + tag invalidation khi app đã dùng Redux cho client state.

**Chọn Zustand / TanStack Query thay thế khi:**

- App nhỏ/vừa, state client đơn giản — Zustand gọn hơn hẳn (không Provider, không action type).
- Toàn bộ nhu cầu là **server cache** — TanStack Query lo hết, không cần store nào.
- Thấy mình viết slice mà không bao giờ mở DevTools — dấu hiệu Redux là nghi thức thừa.

**Bẫy phổ biến:** dùng Redux cho mọi thứ kể cả server cache rồi tự viết loading/error trạng thái tay — đó là việc RTK Query hoặc TanStack Query đã giải quyết rồi.

> **Tóm gọn 1 câu:** Redux đáng giá khi app lớn/cần time-travel/middleware nặng — còn như "mua xe tải để đi mua rau", thì Zustand hoặc Query là đủ.

## Quy ước chung cả track

Mục này nói về bộ quy tắc ứng xử thống nhất áp dụng cho mọi bài trong track. Đọc một lần rồi dùng làm "luật chơi" suốt.

- Một slice một feature, đặt cạnh feature (không gom `actions/`/`reducers/` kiểu cũ — đó là pattern Redux trần đã lỗi thời, RTK gom trong `createSlice`).
- Component chỉ dùng `useAppDispatch`/`useAppSelector` từ `store.ts` — không dùng bản thô của react-redux để giữ typing nhất quán.
- State trong store luôn **serializable** (string/number/boolean/array/object thuần) — không lưu class instance, function, `Date` thô; `serializableCheck` của DevTools middleware sẽ cảnh báo.
- Server cache để Query lo (bài 3 hoặc bài 4) — Redux giữ client state + kết quả đã xử lý.
- Không lưu **derived data** trong store — tính bằng selector (`createSelector` cho tính đắt), tránh lệch dữ liệu.
- Thunk không biết gì về component — trả data, component/gate quyết định hiển thị; lỗi ở Thunk bắt bằng `rejected` matcher, không `try/catch` lơ lửng.

## Trọng tâm cần nắm theo từng bài

Mục này nói về điểm "phải thuộc" của từng bài — đọc như danh sách kiểm tra sau mỗi bài học.

### Bài 1 — slice & store

Typed hooks (`useAppDispatch`) + `Immer` bên trong `createSlice`: viết mutate trực tiếp ("state.todos.push") mà Immer lo immutable bên dưới. Cần phân biệt: code trong reducer **như mutate, không phải mutate thật** — ngoài reducer vẫn phải immutable.

> 📄 **Code ví dụ:** [`examples/01-bai-1-slice-store.ts`](examples/01-bai-1-slice-store.ts)

Sai lầm hay gặp ở bài này: tạo store **trong** component (mỗi render một store mới) hoặc quên typed hooks rồi mỗi nơi một kiểu `RootState` khác nhau.

### Bài 2 — async thunk

Ba action sinh tự động (`pending`/`fulfilled`/`rejected`) + pattern `{ items, status: 'idle'|'loading'|'succeeded'|'failed', error }`. Chống race condition bằng `condition` option hoặc `AbortController` của thunk.

> 📄 **Code ví dụ:** [`examples/02-bai-2-async-thunk.ts`](examples/02-bai-2-async-thunk.ts)

Điểm ăn điểm: `addMatcher(fetchTodos.rejected, ...)` bắt lỗi của *mọi* thunk một chỗ, khỏi lặp.

### Bài 3 — entity adapter

`{ids: [], entities: {}}` — cập nhật O(1) theo id, selector `selectAll`/`selectById` sinh sẵn. Khi nào *không* cần: list chỉ render + filter, không update từng item → state thường gọn hơn.

> 📄 **Code ví dụ:** [`examples/03-bai-3-entity-adapter.ts`](examples/03-bai-3-entity-adapter.ts)

### Bài 4 — RTK Query

`createApi` → hook tự sinh (`useGetPostsQuery`, `useAddPostMutation`) + **tags** invalidation. Điểm ăn điểm: không viết thunk/loading/error tay nữa; cache invalidation theo tag thay vì refetch toàn bộ.

> 📄 **Code ví dụ:** [`examples/04-bai-4-rtk-query.ts`](examples/04-bai-4-rtk-query.ts)

### Bài 5 — DevTools & persist

`serializableCheck` bắt state không serialize được; `persist` + `migrate` khi đổi shape qua version; listener middleware thay thế `redux-observable`/saga cho tác vụ nền.

> 📄 **Code ví dụ:** [`examples/05-bai-5-devtools-persist.ts`](examples/05-bai-5-devtools-persist.ts)

## Lỗi lặp lại ở cả track (devtools thường phơi ra)

1. **Dispatch trong lúc render** — gọi `dispatch` thay vì trong `useEffect`/event ⇒ vòng lặp hoặc cảnh báo store đổi khi render.
2. **Lưu state không serializable** (class instance, `Date` thô) — `serializableCheck` cảnh báo; convert sang string/number trước khi đưa vào store.
3. **Dùng selector tạo object mới mỗi lần** — `useAppSelector((s) => ({ a: s.a, b: s.b }))` re-render liên tục; tách 2 selector hoặc bọc `shallowEqual`.
4. **Gọi fetch trong component rồi `dispatch` set state tay** — thừa vì đã có thunk (bài 2) hoặc RTK Query (bài 4); chọn một đường, đừng trộn.

> **Tóm gọn 1 câu:** Bốn lỗi DevTools hay phơi ra: dispatch sai chỗ, lưu thứ không chụp ảnh được, selector trả đồ mới mỗi lần, và tự tay làm việc của thunk/Query.

## Self-check trước khi coi là "xong track"

Mục này nói về danh sách kiểm tra cuối track — trả lời được đủ 5 ý mới coi là "nắm chắc", chưa thì quay lại bài tương ứng.

1. Viết được slice + typed store + Provider **không nhìn code mẫu**.
2. Giải thích được tại sao `extraReducers` thay cho switch-case action type chuỗi.
3. Chọn đúng: list user fetch từ API → RTK Query hay slice + thunk? (Đáp: RTK Query nếu app đã có Redux, TanStack Query nếu không cần Redux.)
4. Chỉ ra 3 lỗi DevTools thường cảnh báo: state không serializable, dispatch trong render, mutation ngoài Immer.
5. Persist có chọn lọc (`partialize`) — không persist loading/error/mảng khổng lồ.

> **Tóm gọn 1 câu:** Tự viết lại slice + store không nhìn mẫu, và trả lời được "RTK Query hay slice + thunk?" — trả lời trôi chảy là bạn xong track.

## Bài tập tổng hợp track

Mục này nói về bài thực hành gộp cả 5 bài thành một sản phẩm — làm xong là bạn có sẵn khung store cho app thật.

Dựng store cho app "Quản lý khóa học": slice `cart` (client state) + RTK Query api `coursesApi` (server cache) + persist giỏ hàng qua reload + entity adapter cho danh sách enrollment. DevTools phải trace được đầy đủ action thêm/xóa/sửa.

> **Tóm gọn 1 câu:** Một app, bốn mảnh ghép: slice cho client state, Query cho server cache, persist cho giỏ hàng, adapter cho enrollment — DevTools là người chấm bài.

## Reference

- [Redux Toolkit](https://redux-toolkit.js.org/) · [React-Redux hooks](https://react-redux.js.org/api/hooks)
- [RTK Query docs](https://redux-toolkit.js.org/rtk-query/overview) · [Immer](https://immerjs.github.io/immer/)
- So sánh lựa chọn: [Redux vs Zustand — khi nào dùng gì](../3-store-zustand-tanstack-query/README.md)
