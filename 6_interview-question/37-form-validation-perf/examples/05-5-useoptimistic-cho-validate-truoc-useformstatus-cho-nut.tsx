function Submit() {
  const { pending } = useFormStatus(); // KHÔNG cần prop drilling từ form cha
  return <button disabled={pending}>{pending ? "Đang lưu..." : "Đăng ký"}</button>;
}
