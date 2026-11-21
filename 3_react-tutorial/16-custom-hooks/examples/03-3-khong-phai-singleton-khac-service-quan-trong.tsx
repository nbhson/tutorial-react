// Hai component cùng key vẫn 2 bản — demo bản chất không singleton:
function A() { const [n] = useLocalStorage("name"); return <p>A: {n}</p>; }
function B() { const [n] = useLocalStorage("name"); return <p>B: {n}</p>; }
// Gõ ở A (setName) -> A re-render, B đứng yên (state riêng). Muốn chung: store/context + storage event.
