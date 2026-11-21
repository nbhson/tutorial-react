// ❌ SAI: div giả button — Tab không tới, Enter không bấm, SR không đọc là nút
<div onClick={dong}>X</div>
// ✅ ĐÚNG: button thật — focus/keyboard/role miễn phí
<button type="button" onClick={dong}>Đóng</button>
