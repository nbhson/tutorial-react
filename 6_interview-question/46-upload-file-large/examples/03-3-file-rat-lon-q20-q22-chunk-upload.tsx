// ✅ (Q20) — (Q20) 500MB+ (Q20)
async function uploadChunked(file: File, onProgress: (pct: number) => void) {
  const CHUNK = 5 * 1024 * 1024; // (Q20) "5MB (Q20)
  const total = Math.ceil(file.size / CHUNK);
  let uploaded = 0;
  for (let i = 0; i < total; i++) {
    const chunk = file.slice(i * CHUNK, (i + 1) * CHUNK); // (Q20) "Slice (Q20)
    const res = await fetch(`/api/chunk?uploadId=X&part=${i}`, {
      method: "POST",
      body: chunk,
    });
    uploaded += 1;
    onProgress(Math.round((uploaded / total) * 100)); // (Q22) "Progress (Q22)
  }
  await fetch(`/api/complete?uploadId=X`); // (Q20) "Complete (Q20)
}
// (Q20, Q22) "Cancel (Q21) + "resume (Q20, Q22)
// "Cancel (Q21, Q20)
const ac = new AbortController();
uploadChunked(file, setProgress, ac.signal);
ac.abort(); // (Q21, Q20) "Cancel (Q21)
// "Resume (Q20) "Mất mạng, "gửi lại (chunk (Q20) (Q20)
// "Server (Q20) "Nhận (Q20), "Client (Q20) "Kiểm tra (Q20)
