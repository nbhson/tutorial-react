// e tự suy kiểu React.ChangeEvent<HTMLInputElement> — không cần khai tay
<input onChange={(e) => setName(e.target.value)} />
// Form submit: bắt buộc preventDefault nếu không trang reload, app React chết
<form onSubmit={(e) => { e.preventDefault(); save(); }}>
