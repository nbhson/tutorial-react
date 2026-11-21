// ❌ SAI: chỉ Suspense, không Boundary — reject trồi qua, trắng trang
<Suspense fallback={<p>Chờ...</p>}><Heavy /></Suspense>
