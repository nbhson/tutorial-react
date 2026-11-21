// ❌ Tư duy kế thừa (không tồn tại trong React function)
class SpecialCard extends Card {} // không làm thế này

// ✅ Tư duy composition: bọc + slot
<Card><p>Nội dung đặc biệt</p></Card>
<Panel title="Có footer" footer={<button>Lưu</button>}><p>Body</p></Panel>
