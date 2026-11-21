// ❌ SAI: thêm 1 vòng render, sai là loop (set trong effect trigger effect)
useEffect(() => setFullName(first + " " + last), [first, last]);
