// ✅ ĐÚNG: bọc arrow — click mới gọi với payload
<button onClick={() => onAdd(1)}>+1</button>
// Không payload: <button onClick={onAdd}> cũng đúng (truyền tham chiếu)
