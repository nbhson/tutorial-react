// DAY 22 — useActionState + useFormStatus + useOptimistic (self-contained demo).
// Chạy được thuần React (Vite): action là hàm async client với signature chuẩn
// (prevState, formData) => newState. Trong Next.js App Router, thay fakeApi()
// bằng Server Action thật ("use server") + revalidatePath — signature giữ nguyên.

import {
  useEffect,
  useActionState,
  useFormStatus,
  useOptimistic,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

type State = { errors: string[] | null; ok: boolean };
type Comment = { id: string; body: string };

// ── Giả lập API (thật: Server Action / fetch POST) ──
async function fakeApi(body: string): Promise<{ ok: boolean }> {
  await new Promise((r) => setTimeout(r, 800)); // độ trễ để thấy pending
  if (body.toLowerCase().includes("spam")) {
    // Lỗi HỆ THỐNG (throw) → đi vào Error Boundary, KHÔNG phải lỗi validate
    throw new Error("Bị server từ chối");
  }
  return { ok: true };
}

// ── Action: signature (prevState, formData) => newState.
// Lỗi validate = RETURN (state), không throw — bẫy kinh điển. ──
async function addComment(_prev: State, fd: FormData): Promise<State> {
  const body = String(fd.get("body") ?? "").trim();
  if (body.length < 3) return { errors: ["Bình luận ít nhất 3 ký tự"], ok: false };
  if (body.length > 140) return { errors: ["Tối đa 140 ký tự"], ok: false };
  await fakeApi(body);
  return { errors: null, ok: true };
}

// ── SubmitButton: component con riêng — dùng useFormStatus (không prop drilling).
// Quy tắc: hook chỉ đọc được form CHA gần nhất → phải render BÊN TRONG <form>.
// Gọi ở component chứa form => pending mãi false (bẫy số 1 của bài này). ──
function SubmitButton({ children }: { children: ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      style={pending ? { ...btnStyle, opacity: 0.6 } : btnStyle}
    >
      {pending ? "Đang lưu..." : children}
    </button>
  );
}

// ── Form chính: useActionState lo KẾT QUẢ (errors/ok), useFormStatus lo TRẠNG THÁI GỬI ──
export default function CommentBox() {
  const [state, action, pending] = useActionState<State, FormData>(addComment, {
    errors: null,
    ok: false,
  });
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      action={async (fd) => {
        await action(fd);
        if (!state.errors) formRef.current?.reset(); // chỉ reset khi KHÔNG lỗi
      }}
    >
      {/* uncontrolled: chỉ cần name, không value/onChange → gõ 0 re-render */}
      <textarea name="body" placeholder="Viết bình luận..." aria-label="Bình luận" />
      {/* lỗi validate là STATE — hiện cạnh field, screen reader đọc được */}
      {state.errors?.map((e) => (
        <p key={e} role="alert">
          {e}
        </p>
      ))}
      {state.ok && <p role="status">Đã đăng!</p>}
      {/* Nút là component con riêng → useFormStatus. Nút cùng file thì dùng
          `pending` của useActionState ở trên là đủ — CHỌN MỘT nguồn cho một nút. */}
      <SubmitButton>Đăng</SubmitButton>
      <p style={hint}>{pending ? "Đang gửi (pending = true)..." : "Sẵn sàng nhận bình luận"}</p>
    </form>
  );
}

// ── useOptimistic: bình luận hiện NGAY khi submit (mờ 50%), server chốt sau.
// Trong app thật: gọi addOptimistic(...) BÊN TRONG action, TRƯỚC khi await API;
// action throw/return lỗi → React tự rollback danh sách về như cũ. ──
function OptimisticList({ comments, draft }: { comments: Comment[]; draft: string }) {
  const [list, addOptimistic] = useOptimistic<Comment[], string>(
    comments,
    (cur, body) => [...cur, { id: `tmp-${cur.length}`, body }],
  );

  useEffect(() => {
    if (draft.trim()) addOptimistic(draft.trim()); // demo: gõ là hiện ngay, mờ 50%
  }, [draft, addOptimistic]);

  return (
    <ul>
      {list.map((c, i) => {
        const isOptimistic = i >= comments.length; // phần vượt quá data thật = bản chờ server
        return (
          <li key={c.id} style={isOptimistic ? faded : undefined}>
            {c.body} {isOptimistic ? "(đang chờ server...)" : ""}
          </li>
        );
      })}
      {list.length === 0 && <li style={hint}>Chưa có bình luận nào</li>}
    </ul>
  );
}

export function OptimisticDemo() {
  const [comments] = useState<Comment[]>([{ id: "1", body: "Bình luận có sẵn" }]);
  const [draft, setDraft] = useState("");
  return (
    <section>
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder="Gõ để thêm bình luận optimistic..."
        aria-label="Bình luận optimistic"
      />
      <OptimisticList comments={comments} draft={draft} />
    </section>
  );
}

// ── Styles ──
const btnStyle: CSSProperties = {
  padding: "6px 14px",
  borderRadius: 6,
  border: "1px solid #888",
  cursor: "pointer",
};
const faded: CSSProperties = { opacity: 0.5 };
const hint: CSSProperties = { color: "#888", fontSize: 13 };
