// ❌ SAI: HTML user thẳng vào DOM — <img onerror> chạy lúc render
<div dangerouslySetInnerHTML={{ __html: userHtml }} />
// ✅ ĐÚNG: sanitize trước, allowlist hẹp
const clean = DOMPurify.sanitize(userHtml, { ALLOWED_TAGS: ['b', 'i', 'p', 'br'], ALLOWED_ATTR: [] });
<div dangerouslySetInnerHTML={{ __html: clean }} />
