// SubmitButton.tsx — KHÔNG nhận prop pending, tự đọc form cha
function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return <button disabled={pending}>{pending ? "Đang lưu..." : children}</button>;
}

<form action={action}>
  <textarea name="body" />
  <SubmitButton>Đăng</SubmitButton>  {/* con trực tiếp => đọc được pending */}
</form>
