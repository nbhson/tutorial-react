// components/CommentForm.tsx
"use client";
import { useActionState, useRef } from "react";
import { addComment, type CommentState } from "./actions";

export function CommentForm() {
  const [state, action, pending] = useActionState<CommentState, FormData>(addComment, { errors: null, ok: false });
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={async (fd) => { await action(fd); if (!state.errors) formRef.current?.reset(); }}
    >
      <textarea name="body" required minLength={3} />
      {state.errors?.body?.[0] && <p role="alert">{state.errors.body[0]}</p>}
      <SubmitButton /> {/* useFormStatus đọc pending của form cha */}
    </form>
  );
}
