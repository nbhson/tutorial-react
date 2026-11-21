// ✅ ĐÚNG: React escape — payload chỉ hiện thành chữ, không chạy
<div>{'<img src=x onerror=alert(1)>'}</div> // hiện đúng chuỗi đó, không popup
// ❌ SAI: dangerously với HTML thô — payload chạy ngay khi render
<div dangerouslySetInnerHTML={{ __html: '<img src=x onerror=alert(1)>' }} /> // alert bật
