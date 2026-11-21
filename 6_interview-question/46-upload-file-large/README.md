# Q46: Upload video vài trăm MB mà có progress bar, bấm hủy được, mất mạng tải tiếp — em làm thế nào?

## Câu hỏi

> Upload file lớn (50MB video, 100MB ảnh) — `fetch`/`XMLHttpRequest` (Q20) upload thẳng thì UI treo, không có progress, không cancel được.
> Làm sao upload **file lớn** với **progress bar**, **cancel** (user bấm "Hủy"), **resume** (mất mạng giữa chừng, tải tiếp)? `FormData` + `fetch` (Q20) có đủ không? Cần `XMLHttpRequest` (Q22) hay `fetch` (Q20)?

## Trả lời ngắn (elevator pitch, 30 giây)

Mục này là "bản nói 30 giây" — nêu được "fetch không có progress, muốn progress phải XHR, muốn resume phải chunk" là đã ăn điểm; phần chi tiết bên dưới để đỡ khi bị hỏi từng mốc size.

- **Vấn đề gốc**: `fetch` **không có sự kiện tiến trình upload** — chỉ hủy được (AbortController). Muốn progress bar phải dùng `XMLHttpRequest` (`upload.onprogress`).
- **3 cách theo size**: (1) File nhỏ (< 5MB): `FormData` + `fetch` + AbortController — đơn giản, không progress. (2) File lớn (50–500MB): XHR + `upload.onprogress` — có progress, hủy được. (3) File rất lớn (500MB+): chia chunk 5MB, upload từng chunk — có progress từng chunk, hủy được, mất mạng gửi tiếp chunk còn thiếu.
- **Điểm ăn điểm**: resume được vì server nhớ chunk nào rồi, client chỉ gửi tiếp phần thiếu.

## Trả lời chi tiết

Mục này chia theo ba mức kích cỡ file (nhỏ / lớn / rất lớn), mỗi mức một công cụ và một giới hạn — đọc để biết "với file của mình thì dùng cái gì, mất gì".

### 1. "File nhỏ" (Q20) — `FormData` + `fetch` (Q20, Q21)

> 📄 **Code ví dụ:** [`examples/01-1-file-nho-q20-formdata-fetch-q20-q21.tsx`](examples/01-1-file-nho-q20-formdata-fetch-q20-q21.tsx)

**Đúng khi**: **File < 5MB** (Q20, Q21). **Sai khi**: **File lớn (Q22)** — "không progress (Q20) (Q20)".

### 2. "File lớn" (Q22) — `XMLHttpRequest` + `upload.onprogress` (Q22)

> 📄 **Code ví dụ:** [`examples/02-2-file-lon-q22-xmlhttprequest-upload-onprogress-q22.tsx`](examples/02-2-file-lon-q22-xmlhttprequest-upload-onprogress-q22.tsx)

**Đúng khi**: **File lớn (50–500MB) (Q22)** — "progress (Q22)", "cancel (Q22)", "thang (Q22)" (Q22). **Sai khi**: "File rất lớn (Q20, Q22)" — "không resume (Q20, Q22)" (Q20).

### 3. "File rất lớn" (Q20, Q22) — Chunk upload (Q20)

> 📄 **Code ví dụ:** [`examples/03-3-file-rat-lon-q20-q22-chunk-upload.tsx`](examples/03-3-file-rat-lon-q20-q22-chunk-upload.tsx)

**Đúng khi**: **File rất lớn (500MB+ (Q20, Q22))** — "chunk (Q20)", "progress (Q22)", "cancel (Q21)", "resume (Q20)" (Q20, Q22). **Sai khi**: "File nhỏ (Q20, Q21)" — "không (Q20, Q21)" (Q20).

### 4. So sánh (Q20, Q22)

| File size | Cách (Q20, Q22) | Progress (Q22) | Cancel (Q21, Q22) | Resume (Q20) |
|---|---|---|---|---|
| < 5MB (Q20) | `FormData` + `fetch` (Q20, Q21) | Không (Q20) | `AbortController` (Q21) | Không (Q20) |
| 50–500MB (Q22) | `XMLHttpRequest` (Q22) | `upload.onprogress` (Q22) | `xhr.abort()` (Q22) | Không (Q22) |
| 500MB+ (Q20, Q22) | Chunk upload (Q20) | Mỗi chunk (Q22) | `AbortController` (Q21) | Có (Q20) |

> **Cách đọc bảng này:** mỗi dòng là một mức kích cỡ file; đọc ngang để biết cách upload, có progress không, hủy được không và có resume được không — cột Resume là cột phân tầng quan trọng nhất: chỉ chunk upload mới cứu được vụ mất mạng giữa chừng.

**Điểm ăn điểm (Q20, Q22)**: "File lớn (Q22) → `XMLHttpRequest` + `upload.onprogress` (Q22) (Q22); "file rất lớn (Q20, Q22) → chunk (Q20) (Q20, Q22). `fetch` (Q20) không progress (Q20) (Q20).

Ví von cho chunk upload: chuyển nhà cả căn 3 tầng khó hơn đi từng chuyến — chia đồ thành nhiều thùng (chunk 5MB), xe nào tới được kho thì ghi nhận, xe hư giữa đường chỉ bốc lại đúng thùng đó; server nhớ "đã nhận thùng nào" nên client chỉ gửi tiếp phần thiếu — đó chính là resume.

## Bẫy khi phỏng vấn

Mục này là "bản đồ mìn": 4 câu trả lời nghe hợp lý nhưng sai — upload file lớn là chủ đề người ta hay cài mồi "fetch làm được hết".

1. **"Dùng `fetch` upload file lớn để có progress bar"** → **Sai (Q22)**: `fetch` không phát sự kiện tiến trình upload (Q20) — muốn progress phải `XMLHttpRequest` + `upload.onprogress` (Q22).
2. **"`FormData` + `fetch` cho file 500MB"** → **Sai (Q20, Q22)**: không progress, không resume (Q20, Q22) — file rất lớn phải chunk upload (Q20).
3. **"Upload không cần nút hủy"** → **Sai (Q21, Q22)**: phải hủy được — `AbortController` (Q21) với fetch, `xhr.abort()` (Q22) với XHR.
4. **"Progress bar tính percent từ `upload.onprogress`"** → **Đúng (Q22)**: đây chính là cách đo chuẩn — đừng đo bằng `fetch` (Q20) vì nó không phát sự kiện này.

> **Tóm gọn 1 câu:** Upload file lớn như chuyển nhà theo thùng: nhỏ thì một chuyến (fetch), lớn thì cần đồng hồ đo từng thùng (XHR progress), rất lớn thì chia thùng 5MB để mất mạng chỉ bốc lại đúng thùng thiếu.

## Gợi ý câu chốt

Mục này gói cả bài thành một đoạn trả lời mẫu — đọc để tập nói trọn một hơi rồi diễn đạt lại bằng giọng của mình.

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
