// ❌ Thêm <div> "vô nghĩa" vào DOM
function Card() {
  return (
    <div>                // <-- layer DOM thừa
      <div className="card-header">...</div>
      <div className="card-body">...</div>
    </div>
  );
}

// ✅ Fragment: nhóm về phía React, không tạo node
function Card() {
  return (
    <>
      <div className="card-header">...</div>
      <div className="card-body">...</div>
    </>
  );
}
