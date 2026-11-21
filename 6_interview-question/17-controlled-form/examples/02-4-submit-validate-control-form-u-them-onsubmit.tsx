const [err, setErr] = useState("");
const [submitting, setSubmitting] = useState(false);

const submit = (e: React.FormEvent) => {
  e.preventDefault();                 // (1) BẮT BUỘC: chặn reload
  if (submitting) return;            // (2) Chặn bấm kép (nhiều lần click)
  if (!email.includes("@"))          // (3) Validate fail-fast (dừng ngay lỗi đầu)
    return setErr("Email không hợp lệ");
  setSubmitting(true);
  // ...gọi API...
};
