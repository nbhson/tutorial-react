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
