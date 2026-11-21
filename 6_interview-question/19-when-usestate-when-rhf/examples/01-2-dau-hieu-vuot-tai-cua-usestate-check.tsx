// ❌ Tín hiệu nên dừng lại và chuyển RHF khi thấy code đi về phía này:
const [email, setEmail] = useState("");
const [name, setName] = useState("");
const [phone, setPhone] = useState("");
const [pass, setPass] = useState("");
const [confirm, setConfirm] = useState("");
const [emailErr, setEmailErr] = useState("");
const [passErr, setPassErr] = useState("");
const [confirmErr, setConfirmErr] = useState("");
const [submitting, setSubmitting] = useState(false);

const submit = (e) => {
  e.preventDefault();
  // if lồng nhau, fail-fast tay — phình theo mỗi rule:
  if (!name) { setNameErr("Tên bắt buộc"); return; }
  if (!email.includes("@")) { setEmailErr("Email sai"); return; }
  if (pass.length < 6) { setPassErr("Tối thiểu 6 ký tự"); return; }
  if (pass !== confirm) { setConfirmErr("Không khớp"); return; }
  // ...
};
