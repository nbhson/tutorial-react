const todosAdapter = createEntityAdapter<Todo>();
const initialState = todosAdapter.getInitialState({ status: "idle" });
// trong reducer: todosAdapter.upsertOne(state, todo) / removeOne(state, id)
// selector: todosAdapter.getSelectors((root: RootState) => root.todos).selectAll()
