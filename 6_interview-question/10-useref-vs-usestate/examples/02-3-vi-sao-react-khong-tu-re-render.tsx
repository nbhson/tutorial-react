// ❌ SAI — đổi ref nhưng UI đứng im (UI không "biết")
const nameRef = useRef("Son");
<button onClick={() => { nameRef.current = "Linh"; }}>Đổi</button>
<p>{nameRef.current}</p> // vẫn "Son" (ref đổi KHÔNG re-render)
