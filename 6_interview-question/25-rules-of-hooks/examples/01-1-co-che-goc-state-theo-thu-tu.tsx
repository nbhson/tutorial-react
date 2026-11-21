// Render 1 (user = true):
if (user) {
  const [a, setA] = useState(0);   // ô 1
  const [b, setB] = useState(0);   // ô 2
}
// → list: [a, b]

// Render 2 (user = false) — if bỏ qua 2 hook:
// → list: [] (đỗng)

// Render 3 (user = true lại):
// React thấy list render 2 có 0 ô, render 3 đòi 2 ô → LỆCH → "Rendered more hooks"
