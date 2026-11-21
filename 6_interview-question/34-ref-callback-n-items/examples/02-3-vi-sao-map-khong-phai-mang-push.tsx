// ❌ SAI: "push" trong render (mỗi render "thêm" → "tích lũy" SAI, array "phình" "vô hạn")
const refs = useRef([]);
{items.map((it) => <input key={it.id} ref={(el) => refs.current.push(el)} />)}
// render 1: [a,b,c]; render 2 (list đổi): [a,b,c, newA,newB] — "trùng" + "chết" (không "xóa")

// ✅ ĐÚNG: "Map" (key = "id", "set/delete" — "sạch" mỗi "đổi" list)
{items.map((it) => <input key={it.id} ref={setRef(it.id)} />)}  // "set(id, node)" / "del(id)" (unmount)
