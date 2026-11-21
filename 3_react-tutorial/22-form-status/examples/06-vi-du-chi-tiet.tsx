// Giả lập Server Action bằng hàm async client — signature giữ nguyên (prev, formData)
type State = { errors: string[] | null; ok: boolean };

async function addComment(_prev: State, fd: FormData): Promise<State> {
  const body = String(fd.get("body") ?? "").trim();
  if (body.length < 3) return { errors: ["Bình luận ít nhất 3 ký tự"], ok: false };
  if (body.length > 140) return { errors: ["Tối đa 140 ký tự"], ok: false };
  await fakeApi(body); // 800ms — thử bấm kép: nút đã disable
  return { errors: null, ok: true };
}

export default function CommentBox() {
  const [state, action, pending] = useActionState(addComment, { errors: null, ok: false });
  return (
    <form action={action}>
      <textarea name="body" placeholder="Viết bình luận..." aria-label="Bình luận" />
      {state.errors && state.errors.map((e) => <p key={e} role="alert">{e}</p>)}
      {state.ok && <p role="status">Đã đăng!</p>}
      <SubmitButton>Đăng</SubmitButton>
    </form>
  );
}

// SubmitButton — component con riêng, dùng useFormStatus (đây là lý do hook này tồn tại)
function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending}>
      {pending ? "Đang lưu..." : children}
    </button>
  );
}
