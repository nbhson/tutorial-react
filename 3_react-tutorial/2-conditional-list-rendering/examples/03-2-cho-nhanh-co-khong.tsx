// ❌ SAI: count = 0 -> hiện số 0 lạc lõng
const count = 0;
return <div>{count && <span>Có tin nhắn</span>}</div>; // vẽ "0"

// ✅ ĐÚNG: so sánh trả boolean — false bị bỏ qua đúng ý
return <div>{count > 0 && <span>Có {count} tin nhắn</span>}</div>; // vẽ nothing
