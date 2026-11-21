// ❌ SAI: hook trong hàm thường — vi phạm rules of hooks
<Mouse>{(pos) => { const [x] = useState(0); return <p>{pos.x}</p>; }}</Mouse>
