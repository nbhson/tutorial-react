// Một chiều xuống: state -> UI
<p>Your name: {name}</p> // name đổi -> dòng này đổi, không chiều ngược lại

// Một chiều lên: UI -> state qua event
<input value={name} onChange={(e) => setName(e.target.value)} />
// Người gõ -> onChange fire -> setName -> state đổi -> <p> vẽ lại
