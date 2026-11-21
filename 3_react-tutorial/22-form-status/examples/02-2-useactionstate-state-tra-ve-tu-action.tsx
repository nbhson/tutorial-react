type State = { errors: string[] | null };
const [state, action, pending] = useActionState(async (_prev: State, fd: FormData) => {
  const body = String(fd.get("body") ?? "");
  if (body.length < 3) return { errors: ["Ít nhất 3 ký tự"] };
  await api.addComment(body);       // lỗi ném ra => React giữ prev state? KHÔNG — throw là crash boundary
  return { errors: null };          // validation error = state, KHÔNG throw
}, { errors: null });

<form action={action}>
  <textarea name="body" />
  {state.errors && <p role="alert">{state.errors[0]}</p>}
</form>
