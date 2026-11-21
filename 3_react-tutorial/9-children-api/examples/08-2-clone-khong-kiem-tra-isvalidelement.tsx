// ✅ ĐÚNG: cổng kiểm tra, string giữ nguyên
Children.map(children, (c) => {
  if (!isValidElement(c)) return c;
  return cloneElement(c, { onClick: fn });
});
