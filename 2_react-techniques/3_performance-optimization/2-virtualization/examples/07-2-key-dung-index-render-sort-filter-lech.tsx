// ❌ SAI: key theo thứ tự render — reorder là React nhầm node
{v.getVirtualItems().map((vi, idx) => <div key={idx}>)}
// ✅ ĐÚNG: key ổn định từ virtualizer (hoặc id thật qua getItemKey)
{v.getVirtualItems().map((vi) => <div key={vi.key}>)}
