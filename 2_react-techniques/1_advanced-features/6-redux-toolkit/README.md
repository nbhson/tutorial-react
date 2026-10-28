# Redux Toolkit — Mini-track chi tiết

> Nguồn: https://redux-toolkit.js.org/ · Đọc trước: [bài 3](../3-store-zustand-tanstack-query/README.md) (khi nào cần Redux thay vì Zustand).

## Mục tiêu track

- Làm chủ từng mảnh Redux Toolkit (RTK) riêng lẻ thay vì học dồn: slice → async → chuẩn hóa → fetch → debug/persist.
- Cuối track dựng được store app lớn: nhiều slice + thunk + entity adapter + RTK Query + DevTools time-travel.
- Biết **khi nào chọn Redux thay vì Zustand** — và khi nào Redux là thừa.

## Bản đồ khái niệm

| # | Thư mục | Khái niệm | Khi nào dùng |
|---|---|---|---|
| 1 | [1-slice-store/](1-slice-store/README.md) | `createSlice`, `configureStore`, `Provider`, typed hooks, Immer | Mọi app Redux — nền bắt buộc |
| 2 | [2-async-thunk/](2-async-thunk/README.md) | `createAsyncThunk`, `extraReducers`, mẫu `status`/`error` | Mọi gọi API đưa vào store |
| 3 | [3-entity-adapter/](3-entity-adapter/README.md) | `createEntityAdapter`, chuẩn hóa `{ids, entities}` | Collection cần update/xóa từng item |
| 4 | [4-rtk-query/](4-rtk-query/README.md) | `createApi`, tags, hook tự sinh | App đã có Redux và muốn fetch hợp nhất |
| 5 | [5-devtools-persist/](5-devtools-persist/README.md) | DevTools time-travel, `serializableCheck`, persist, listener | Debug + giữ state qua reload |

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

## Khi nào dùng Redux Toolkit — khi nào không

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

## Quy ước chung cả track

- Một slice một feature, đặt cạnh feature (không gom `actions/`/`reducers/` kiểu cũ — đó là pattern Redux trần đã lỗi thời, RTK gom trong `createSlice`).
- Component chỉ dùng `useAppDispatch`/`useAppSelector` từ `store.ts` — không dùng bản thô của react-redux để giữ typing nhất quán.
- State trong store luôn **serializable** (string/number/boolean/array/object thuần) — không lưu class instance, function, `Date` thô; `serializableCheck` của DevTools middleware sẽ cảnh báo.
- Server cache để Query lo (bài 3 hoặc bài 4) — Redux giữ client state + kết quả đã xử lý.
- Không lưu **derived data** trong store — tính bằng selector (`createSelector` cho tính đắt), tránh lệch dữ liệu.
- Thunk không biết gì về component — trả data, component/gate quyết định hiển thị; lỗi ở Thunk bắt bằng `rejected` matcher, không `try/catch` lơ lửng.

## Trọng tâm cần nắm theo từng bài

### Bài 1 — slice & store

Typed hooks (`useAppDispatch`) + `Immer` bên trong `createSlice`: viết mutate trực tiếp ("state.todos.push") mà Immer lo immutable bên dưới. Cần phân biệt: code trong reducer **như mutate, không phải mutate thật** — ngoài reducer vẫn phải immutable.

```ts
// store.ts — nền dùng lại suốt track
import { configureStore, createSlice } from "@reduxjs/toolkit";

const todosSlice = createSlice({
  name: "todos",
  initialState: { items: [] as Todo[], filter: "all" },
  reducers: {
    addTodo: (state, action: PayloadAction<string>) => {
      state.items.push({ id: crypto.randomUUID(), text: action.payload }); // "mutate" — Immer lo immutable
    },
    removeTodo: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((t) => t.id !== action.payload); // gán lại cũng được
    },
  },
});

export const store = configureStore({ reducer: { todos: todosSlice.reducer } });
export type RootState = ReturnType<typeof store.getState>;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
export const useAppDispatch: () => typeof store.dispatch = useDispatch;
```

Sai lầm hay gặp ở bài này: tạo store **trong** component (mỗi render một store mới) hoặc quên typed hooks rồi mỗi nơi một kiểu `RootState` khác nhau.

### Bài 2 — async thunk

Ba action sinh tự động (`pending`/`fulfilled`/`rejected`) + pattern `{ items, status: 'idle'|'loading'|'succeeded'|'failed', error }`. Chống race condition bằng `condition` option hoặc `AbortController` của thunk.

```ts
const fetchTodos = createAsyncThunk("todos/fetch", async (_, { signal }) => {
  const res = await fetch("/api/todos", { signal }); // thunk hủy => fetch hủy theo
  return res.json();
});

// extraReducers của slice — KHÔNG viết trong reducers
builder
  .addCase(fetchTodos.pending, (s) => { s.status = "loading"; })
  .addCase(fetchTodos.fulfilled, (s, a) => { s.status = "succeeded"; s.items = a.payload; })
  .addCase(fetchTodos.rejected, (s, a) => { s.status = "failed"; s.error = a.error.message ?? ""; });
```

Điểm ăn điểm: `addMatcher(fetchTodos.rejected, ...)` bắt lỗi của *mọi* thunk một chỗ, khỏi lặp.

### Bài 3 — entity adapter

`{ids: [], entities: {}}` — cập nhật O(1) theo id, selector `selectAll`/`selectById` sinh sẵn. Khi nào *không* cần: list chỉ render + filter, không update từng item → state thường gọn hơn.

```ts
const todosAdapter = createEntityAdapter<Todo>();
const initialState = todosAdapter.getInitialState({ status: "idle" });
// trong reducer: todosAdapter.upsertOne(state, todo) / removeOne(state, id)
// selector: todosAdapter.getSelectors((root: RootState) => root.todos).selectAll()
```

### Bài 4 — RTK Query

`createApi` → hook tự sinh (`useGetPostsQuery`, `useAddPostMutation`) + **tags** invalidation. Điểm ăn điểm: không viết thunk/loading/error tay nữa; cache invalidation theo tag thay vì refetch toàn bộ.

```ts
const api = createApi({
  baseQuery: fetchBaseQuery({ baseUrl: "/api" }),
  tagTypes: ["Todo"],
  endpoints: (b) => ({
    getTodos: b.query<Todo[], void>({ query: () => "todos", providesTags: ["Todo"] }),
    addTodo: b.mutation<Todo, string>({
      query: (text) => ({ url: "todos", method: "POST", body: { text } }),
      invalidatesTags: ["Todo"], // refetch đúng những query tag "Todo"
    }),
  }),
});
```

### Bài 5 — DevTools & persist

`serializableCheck` bắt state không serialize được; `persist` + `migrate` khi đổi shape qua version; listener middleware thay thế `redux-observable`/saga cho tác vụ nền.

```ts
createListenerMiddleware({
  effect: async (action, api) => {
    if (todosSlice.actions.addTodo.match(action)) {
      analytics.track("todo_added"); // side-effect ngoài reducer
    }
  },
});
```

## Lỗi lặp lại ở cả track (devtools thường phơi ra)

1. **Dispatch trong lúc render** — gọi `dispatch` thay vì trong `useEffect`/event ⇒ vòng lặp hoặc cảnh báo store đổi khi render.
2. **Lưu state không serializable** (class instance, `Date` thô) — `serializableCheck` cảnh báo; convert sang string/number trước khi đưa vào store.
3. **Dùng selector tạo object mới mỗi lần** — `useAppSelector((s) => ({ a: s.a, b: s.b }))` re-render liên tục; tách 2 selector hoặc bọc `shallowEqual`.
4. **Gọi fetch trong component rồi `dispatch` set state tay** — thừa vì đã có thunk (bài 2) hoặc RTK Query (bài 4); chọn một đường, đừng trộn.

## Self-check trước khi coi là "xong track"

## Self-check trước khi coi là "xong track"

1. Viết được slice + typed store + Provider **không nhìn code mẫu**.
2. Giải thích được tại sao `extraReducers` thay cho switch-case action type chuỗi.
3. Chọn đúng: list user fetch từ API → RTK Query hay slice + thunk? (Đáp: RTK Query nếu app đã có Redux, TanStack Query nếu không cần Redux.)
4. Chỉ ra 3 lỗi DevTools thường cảnh báo: state không serializable, dispatch trong render, mutation ngoài Immer.
5. Persist có chọn lọc (`partialize`) — không persist loading/error/mảng khổng lồ.

## Bài tập tổng hợp track

Dựng store cho app "Quản lý khóa học": slice `cart` (client state) + RTK Query api `coursesApi` (server cache) + persist giỏ hàng qua reload + entity adapter cho danh sách enrollment. DevTools phải trace được đầy đủ action thêm/xóa/sửa.

## Reference

- [Redux Toolkit](https://redux-toolkit.js.org/) · [React-Redux hooks](https://react-redux.js.org/api/hooks)
- [RTK Query docs](https://redux-toolkit.js.org/rtk-query/overview) · [Immer](https://immerjs.github.io/immer/)
- So sánh lựa chọn: [Redux vs Zustand — khi nào dùng gì](../3-store-zustand-tanstack-query/README.md)
