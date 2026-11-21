// Hàm thuần: vào mảng cũ + from/to, ra mảng mới — không mutate, dễ test
function move<T>(list: T[], from: number, to: number): T[] {
  if (from === to) return list; // thả về chỗ cũ: no-op, giữ tham chiếu cũ
  const next = [...list]; // bất biến: copy trước khi sửa
  const [m] = next.splice(from, 1); // rút item khỏi vị trí cũ
  next.splice(to, 0, m); // chèn vào vị trí mới
  return next; // mảng mới cho React re-render
}

// Test unit mẫu (Vitest): không cần render, không cần giả drag event
// expect(move(["A", "B", "C"], 0, 2)).toEqual(["B", "C", "A"]);
// expect(move(["A", "B"], 1, 1)).toEqual(["A", "B"]); // no-op giữ nguyên
