// ❌ SAI: mỗi render push thêm — mảng phình, index lệch
const refs = useRef<HTMLElement[]>([]);
<div ref={(el) => { if (el) refs.current.push(el); }} />
