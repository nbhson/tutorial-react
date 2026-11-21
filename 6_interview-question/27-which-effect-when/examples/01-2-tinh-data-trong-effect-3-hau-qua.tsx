// ❌ SAI: sort rồi set state (effect tính data)
useEffect(() => { setItems(items.sort()); }, [items]); // render 1: items chưa sort (flash), rồi sort + setItems → render 2
// → 2 lần render, UI nhảy, + StrictMode double = 4 lần; items đổi là chạy lại (loop tiềm ẩn)

// ✅ ĐÚNG: tính trong render (derived) — không state, không effect
const sorted = [...items].sort(); // (bản copy để không mutate props)
// render luôn có data "sẵn" (pure) — không flash, không loop
