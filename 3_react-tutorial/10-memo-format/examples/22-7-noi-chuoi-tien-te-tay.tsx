// ✅ ĐÚNG: Intl đúng mọi locale
<p>{new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n)}</p>
