// ✅ (Q22) — (Q22) 50–500MB (Q22)
function uploadLarge(file: File, onProgress: (pct: number) => void, onDone: (url: string) => void) {
  const fd = new FormData();
  fd.append("file", file);
  const xhr = new XMLHttpRequest();
  xhr.open("POST", "/api/upload");
  xhr.upload.onprogress = (e) => {
    if (e.lengthComputable) {
      const pct = Math.round((e.loaded / e.total) * 100);
      onProgress(pct); // (Q22) "Progress (Q22)
    }
  };
  xhr.onload = () => onDone(JSON.parse(xhr.response).url);
  xhr.send(fd);
  // (Q22, Q21) "Cancel (Q22)
  return () => xhr.abort(); // (Q22) "Cancel (Q22)
}
// (Q22, Q21) "Cancel (Q22)
const cancel = uploadLarge(file, setProgress, setUrl);
// "Cancel (Q22, Q21)
cancel(); // (Q22) "Cancel (Q22)
