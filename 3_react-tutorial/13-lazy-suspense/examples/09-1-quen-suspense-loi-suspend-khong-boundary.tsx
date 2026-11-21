// ✅ ĐÚNG: bọc sát lazy với fallback nhỏ
return <Suspense fallback={<p>Đang tải...</p>}><Heavy /></Suspense>;
