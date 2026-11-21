// ❌ SAI: rò rỉ mọi prop (kể cả onAdd nội bộ) xuống DOM button -> warning unknown prop
function Btn(props: any) { return <button {...props}>Hi</button>; }
