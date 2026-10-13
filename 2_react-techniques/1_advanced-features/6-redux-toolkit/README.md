# Redux Toolkit — Mini-track chi tiết

> Nguồn: https://redux-toolkit.js.org/
> Đọc trước: [bài 3](../3-store-zustand-tanstack-query/README.md) (khi nào cần Redux thay vì Zustand).

## Mục tiêu track
- Làm chủ từng mảnh Redux Toolkit riêng lẻ thay vì học dồn: slice → async → chuẩn hóa → fetch → debug/persist.
- Cuối track dựng được store app lớn: nhiều slice + thunk + entity + DevTools time-travel.

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

Lý do: `1` là nền không thể bỏ; `2` xử lý async cho slice ở bài 1; `3` chuẩn hóa collection mà bài 2 fetch về;
`4` là nhánh thay thế bài 2+3 cho fetch (đọc để biết chọn, không bắt buộc dùng); `5` là công cụ dùng suốt quá trình.

## Quy ước chung cả track
- Một slice một feature, đặt cạnh feature (không gom `actions/`/`reducers/` kiểu cũ).
- Component chỉ dùng `useAppDispatch`/`useAppSelector` từ `store.ts` — không dùng bản thô của react-redux.
- State trong store luôn serializable (string/number/boolean/array/object thuần).
- Server cache để Query lo (bài 3 hoặc bài 4) — Redux giữ client state + kết quả đã xử lý.

## Reference
- [Redux Toolkit](https://redux-toolkit.js.org/) · [React-Redux hooks](https://react-redux.js.org/api/hooks)
