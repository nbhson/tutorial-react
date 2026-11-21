// ✅ ĐÚNG: key ổn định — xóa item đầu, các item còn lại giữ đúng state
pending.map((t) => <li key={t.id}>{t.text}</li>)

// ❌ SAI: key index — xóa item đầu, index dịch, React tưởng "cùng item"
pending.map((t, i) => <li key={i}>{t.text}</li>)
// Hậu quả: ô input đang gõ ở dòng 2 nhảy lên dòng 1, checkbox tick sai dòng
