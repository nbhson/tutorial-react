// ❌ SAI: nút mặc định type="submit" trong form thì ổn, nhưng ngoài form hoặc type="button" là không submit;
// thiếu preventDefault là reload trắng trang
<form onSubmit={(e) => { save(); }}><button>Bấm</button></form> // reload!
