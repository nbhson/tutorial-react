// example.tsx: onConnected đọc first/last mới nhất, effect deps sạch
const onConnected = useEffectEvent(() => {
  console.log("Connected, tên hiện tại:", first, last);
});
useEffect(() => { onConnected(); }, []); // deps [] — đổi tên không reconnect, log vẫn tên mới
// So sánh: thêm [first, last] vào deps là gõ mỗi phím reconnect (sai); disable lint là giấu stale (sai hơn)
