"use client";
const [state, action, pending] = useActionState(addComment, { errors: null, ok: false });

<form action={action}>
  <textarea name="body" />            {/* uncontrolled: gõ 0 re-render (DAY 22 khác DAY 11 controlled) */}
  {state.errors?.map((e) => <p key={e} role="alert">{e}</p>)}
  <SubmitButton>Đăng bình luận</SubmitButton>  {/* useFormStatus bên trong */}
</form>
