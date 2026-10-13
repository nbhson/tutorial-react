# Q46: Upload video vài trăm MB mà có progress bar, bấm hủy được, mất mạng tải tiếp — em làm thế nào?

## Câu hỏi

> Upload file lớn (50MB video, 100MB ảnh) — `fetch`/`XMLHttpRequest` (Q20) upload thẳng thì UI treo, không có progress, không cancel được.
> Làm sao upload **file lớn** với **progress bar**, **cancel** (user bấm "Hủy"), **resume** (mất mạng giữa chừng, tải tiếp)? `FormData` + `fetch` (Q20) có đủ không? Cần `XMLHttpRequest` (Q22) hay `fetch` (Q20)?

## Trả lời ngắn (elevator pitch, 30 giây)
- **Vấn đề gốc**: `fetch` **không có sự kiện tiến trình upload** — chỉ hủy được (AbortController). Muốn progress bar phải dùng `XMLHttpRequest` (`upload.onprogress`).
- **3 cách theo size**: (1) File nhỏ (< 5MB): `FormData` + `fetch` + AbortController — đơn giản, không progress. (2) File lớn (50–500MB): XHR + `upload.onprogress` — có progress, hủy được. (3) File rất lớn (500MB+): chia chunk 5MB, upload từng chunk — có progress từng chunk, hủy được, mất mạng gửi tiếp chunk còn thiếu.
- **Điểm ăn điểm**: resume được vì server nhớ chunk nào rồi, client chỉ gửi tiếp phần thiếu.

## Trả lời chi tiết

### 1. "File nhỏ" (Q20) — `FormData` + `fetch` (Q20, Q21)

```tsx
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
```

**Đúng khi**: **File < 5MB** (Q20, Q21). **Sai khi**: **File lớn (Q22)** — "không progress (Q20) (Q20)".

### 2. "File lớn" (Q22) — `XMLHttpRequest` + `upload.onprogress` (Q22)

```tsx
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
```

**Đúng khi**: **File lớn (50–500MB) (Q22)** — "progress (Q22)", "cancel (Q22)", "thang (Q22)" (Q22). **Sai khi**: "File rất lớn (Q20, Q22)" — "không resume (Q20, Q22)" (Q20).

### 3. "File rất lớn" (Q20, Q22) — Chunk upload (Q20)

```tsx
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
```

**Đúng khi**: **File rất lớn (500MB+ (Q20, Q22))** — "chunk (Q20)", "progress (Q22)", "cancel (Q21)", "resume (Q20)" (Q20, Q22). **Sai khi**: "File nhỏ (Q20, Q21)" — "không (Q20, Q21)" (Q20).

### 4. So sánh (Q20, Q22)

| File size | Cách (Q20, Q22) | Progress (Q22) | Cancel (Q21, Q22) | Resume (Q20) |
|---|---|---|---|---|
| < 5MB (Q20) | `FormData` + `fetch` (Q20, Q21) | Không (Q20) | `AbortController` (Q21) | Không (Q20) |
| 50–500MB (Q22) | `XMLHttpRequest` (Q22) | `upload.onprogress` (Q22) | `xhr.abort()` (Q22) | Không (Q22) |
| 500MB+ (Q20, Q22) | Chunk upload (Q20) | Mỗi chunk (Q22) | `AbortController` (Q21) | Có (Q20) |

**Điểm ăn điểm (Q20, Q22)**: "File lớn (Q22) → `XMLHttpRequest` + `upload.onprogress` (Q22) (Q22); "file rất lớn (Q20, Q22) → chunk (Q20) (Q20, Q22). `fetch` (Q20) không progress (Q20) (Q20).

## Bẫy khi phỏng vấn

1. **"fetch (Q20) upload file lớn"** → **Sai (Q22)**: "không progress (Q20) (Q20)". `XMLHttpRequest` (Q22) có `upload.onprogress` (Q22) (Q22).
2. **"FormData (Q20) upload 500MB"** → **Sai (Q20, Q22)**: "không (Q20, Q22)", "không resume (Q20, Q22)" (Q20). Chunk (Q20) đúng (Q20, Q22).
3. **"Không (Q21, Q22) upload"** → **Sai (Q21, Q22)**: "`AbortController` (Q21) (fetch) (Q21) hoặc `xhr.abort()` (Q22) (XHR) (Q22)".
4. **"Progress (Q22) = `onprogress` (Q22)"** → **Đúng (Q22)**: "`upload.onprogress` (Q22) (Q22)", "percent (Q22)" (Q22).

## Gợi ý câu chốt

> "Upload file (Q20, Q22): (1) **< 5MB** (Q20) → `FormData` + `fetch` (Q20, Q21) + `AbortController` (Q21) cancel (Q20, Q21) (Q20, Q21). (2) **50–500MB** (Q22) → **`XMLHttpRequest` (Q22) + `upload.onprogress`** (Q22) (progress (Q22), cancel (Q22), no (Q22)) (Q22). (3) **500MB+** (Q20, Q22) → **chunk upload (Q20)** (Q20, Q22) (progress (Q22), cancel (Q21), resume (Q20)) (Q20, Q22). `fetch` (Q20) không progress (Q20) (Q20) — "sai (Q22) file lớn (Q22)". **Điểm ăn điểm (Q20, Q22)**: "chunk (Q20) + `upload.onprogress` (Q22) + `AbortController` (Q21)" (Q20, Q21, Q22).

## Reference

- [`20-data-fetching`](../20-data-fetching/README.md) — "FormData, fetch (Q20), chunk (Q20)"
- [`22-interceptor`](../22-interceptor/README.md) — "XMLHttpRequest (Q22), upload.onprogress (Q22)"
- [`21-abort-on-navigate`](../21-abort-on-navigate/README.md) — "AbortController (Q21), cancel (Q21)"
- [`29-concurrency-transition-deferred`](../29-concurrency-transition-deferred/README.md) — "Transition (Q29), cancel (Q21)"
- [`30-rerender-pipeline`](../30-rerender-pipeline/README.md) — "Re-render (Q30), progress (Q22)"

## Câu hỏi liên quan

- **Hỏi tiếp (liên tục)**: [Q20 — Data fetching (FormData, fetch (Q20), chunk (Q20)?](../20-data-fetching/README.md) · [Q22 — Interceptor (XMLHttpRequest (Q22), upload.onprogress (Q22)?](../22-interceptor/README.md)
- **Đào sâu (xuyên nhóm)**: [Q21 — Abort (AbortController (Q21), cancel (Q21)?](../21-abort-on-navigate/README.md) · [Q29 — Concurrency (Transition (Q29), cancel (Q21)?](../29-concurrency-transition-deferred/README.md) · [Q30 — Re-render pipeline (progress (Q22, Q30)?](../30-rerender-pipeline/README.md)
