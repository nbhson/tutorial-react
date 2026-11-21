// (1) invalidate (mặc định, an toàn):
const createPost = useMutation({
  mutationFn: (input: NewPost) => api.post("/posts", input),
  onSuccess: () => qc.invalidateQueries({ queryKey: postsKeys.list(limit) }),
});

// (2) setQueryData (mirror — instant, "chủ" hơn):
onSuccess: (created, input) => {
  qc.setQueryData<Post[]>(postsKeys.list(limit), (old) =>
    old ? [created, ...old] : [created],        // "biết" created sẽ là item đầu (API insert-on-top)
  );
  // chi tiết item (nếu có): qc.setQueryData(postsKeys.detail(created.id), created);
}
