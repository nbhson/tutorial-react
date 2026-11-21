// ❌ useState "mô phỏng" state machine (rule rải trong handler):
const [status, setStatus] = useState("idle");
const [data, setData] = useState(null);
const [err, setErr] = useState("");

const load = () => {
  if (status === "loading") return;            // ← guard này PHẢI nhớ viết tay (dễ sót nếu thêm code)
  setStatus("loading"); setErr("");
  fetchUsers().then(setData).catch(setErr);
};
// (a) Rule "chỉ từ error mới retry" không có — retry được từ state nào cũng (dễ sai)
// (b) 3 state riêng (status/data/err) — đổi "một phần" = 3 setter (order dễ sai)
