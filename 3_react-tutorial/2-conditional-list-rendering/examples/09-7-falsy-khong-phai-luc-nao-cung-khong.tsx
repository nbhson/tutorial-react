// Bị bỏ qua (không vẽ): null, false, undefined, true
{false && <span/>} // nothing
{null} // nothing
// BỊ VẼ (gây bất ngờ): 0, "", NaN
{0} // vẽ "0"
{""} // vẽ text rỗng (vô hình nhưng vẫn là node, có thể lệch layout flex)
