// ✅ ĐÚNG: functional update đọc giá trị mới nhất do React đảm bảo
<button onClick={() => { setCount((c) => c + 1); setCount((c) => c + 1); }}>+2</button> // +2 đúng
