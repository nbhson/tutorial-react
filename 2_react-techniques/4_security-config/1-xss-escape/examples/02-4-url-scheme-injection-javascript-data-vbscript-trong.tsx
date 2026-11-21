// ❌ SAI: blacklist javascript: — sót data:, vbscript:, encoding lách
const ok = !href.includes('javascript:');
// ✅ ĐÚNG: allowlist — chỉ 3 protocol này được làm link, còn lại thành chữ
const u = new URL(href, window.location.origin);
const ok = ['https:', 'http:', 'mailto:'].includes(u.protocol);
