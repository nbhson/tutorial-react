// ❌ SAI: đổi ref không vẽ lại — UI đứng im dù dữ liệu đổi
const nameRef = useRef("Son");
<button onClick={() => { nameRef.current = "Linh"; }}>Đổi</button>
<p>{nameRef.current}</p> // vẫn "Son"
