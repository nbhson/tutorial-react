// ✅ (Q20) — (Q20, Q21) < 5MB (Q20, Q21)
async function uploadSmall(file: File, signal?: AbortSignal) {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch("/api/upload", {
    method: "POST",
    body: fd,
    signal, // (Q21) "Cancel (Q21)
  });
  if (!res.ok) throw new Error("Upload failed");
  return res.json();
}
// (Q20, Q21) "Cancel (Q21, Q20)
const ac = new AbortController();
uploadSmall(file, ac.signal);
ac.abort(); // (Q21, Q20) "Cancel (Q21)
// (Q20) "Không progress (Q20) (Q20, Q21) — "sai (Q22) file lớn (Q22)"
