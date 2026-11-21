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
