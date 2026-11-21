// Signup.tsx — CLIENT: useActionState nhận state lỗi + useFormStatus hiện pending
"use client";
const [state, action, pending] = useActionState(signup, { errors: null });

return (
  <form action={action}>
    <input name="email" />      {/* KHÔNG value/onChange — uncontrolled, React 19 giữ giá trị qua submit */}
    {state.errors?.email && <span>{state.errors.email[0]}</span>}
    <Submit />                  {/* trong Submit dùng useFormStatus() đọc pending */}
  </form>
);
