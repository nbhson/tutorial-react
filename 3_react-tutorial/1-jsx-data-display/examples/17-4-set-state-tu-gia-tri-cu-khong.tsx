// ❌ SAI: đọc snapshot cũ — bấm nhanh 2 lần chỉ tăng 1
<button onClick={() => { setCount(count + 1); setCount(count + 1); }}>+2?</button> // chỉ +1
