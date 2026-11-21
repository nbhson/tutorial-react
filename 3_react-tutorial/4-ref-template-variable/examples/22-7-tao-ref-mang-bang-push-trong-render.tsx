// ✅ ĐÚNG: callback ref gán theo index/key, hoặc Map
const map = useRef(new Map<string, HTMLElement>());
<div ref={(el) => { if (el) map.current.set(id, el); else map.current.delete(id); }} />
