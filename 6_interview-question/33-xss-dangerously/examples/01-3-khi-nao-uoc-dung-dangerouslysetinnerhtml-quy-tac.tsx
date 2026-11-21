import DOMPurify from "dompurify";

// (1) Markdown → HTML (lib) — HTML THÔ (chưa an toàn)
const raw = marked.parse(userComment);

// (2) SANITIZE (loại thẻ/thuộc tính độc, giữ thẻ lành) — BẮT BUỘC trước khi vào DOM
const clean = DOMPurify.sanitize(raw, { USE_PROFILES: { html: true } }); // allowlist thẻ

// (3) mới "mở cửa" (React "mặc định" escape — ở đây "giật" lá chắn, đã sanitize)
<div dangerouslySetInnerHTML={{ __html: clean }} />
