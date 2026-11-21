// JSX biên dịch thành object (mô tả UI), KHÔNG phải DOM node thật:
<p onClick={handler}>Count: {count}</p>
// ≈ jsx("p", { onClick: handler, children: `Count: ${count}` })
