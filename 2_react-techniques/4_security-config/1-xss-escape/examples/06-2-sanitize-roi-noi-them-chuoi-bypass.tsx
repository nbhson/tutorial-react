// ❌ SAI: phần nối thêm chưa sanitize — attacker nhét payload vào phần nối
<div dangerouslySetInnerHTML={{ __html: clean + userSuffix }} />
// ✅ ĐÚNG: nối trước, sanitize sau cùng ngay trước render
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(raw + suffix, config) }} />
