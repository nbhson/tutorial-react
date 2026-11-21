createListenerMiddleware({
  effect: async (action, api) => {
    if (todosSlice.actions.addTodo.match(action)) {
      analytics.track("todo_added"); // side-effect ngoài reducer
    }
  },
});
