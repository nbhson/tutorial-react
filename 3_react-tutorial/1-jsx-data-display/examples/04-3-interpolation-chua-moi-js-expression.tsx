// ❌ SAI: statement trong {} — lỗi cú pháp
<p>{if (age > 18) { return "lớn"; }}</p>
// ✅ ĐÚNG: expression tương đương
<p>{age > 18 ? "lớn" : "nhỏ"}</p>
