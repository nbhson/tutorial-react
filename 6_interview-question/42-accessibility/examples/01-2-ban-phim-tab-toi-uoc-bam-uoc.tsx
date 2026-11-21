// ❌ Sai: div giả button — Tab không tới, Enter không ăn, SR không hiểu
<div onClick={submit}>Gửi</div>

// ✅ Đúng: button thật — miễn phí toàn bộ hành vi bàn phím + semantics
<button onClick={submit}>Gửi</button>
