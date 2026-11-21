// ❌ SAI: "blacklist" javascript: — SÓT data:, vbscript:, + lách (khoảng trắng/\u0000/encoding)
const ok = !href.includes("javascript:");

// ✅ ĐÚNG: "ALLOWLIST" (chỉ 3 protocol này là link hợp lệ, còn lại = "chữ")
const u = new URL(href, window.location.origin);
const ok = ["https:", "http:", "mailto:"].includes(u.protocol);
// → <a href={ok ? href : undefined}>{label}</a> (không ok thì "không thành link")
