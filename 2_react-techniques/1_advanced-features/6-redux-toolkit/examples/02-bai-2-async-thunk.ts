const fetchTodos = createAsyncThunk("todos/fetch", async (_, { signal }) => {
  const res = await fetch("/api/todos", { signal }); // thunk hủy => fetch hủy theo
  return res.json();
});

// extraReducers của slice — KHÔNG viết trong reducers
builder
  .addCase(fetchTodos.pending, (s) => { s.status = "loading"; })
  .addCase(fetchTodos.fulfilled, (s, a) => { s.status = "succeeded"; s.items = a.payload; })
  .addCase(fetchTodos.rejected, (s, a) => { s.status = "failed"; s.error = a.error.message ?? ""; });
