// ❌ SAI: push giữ tham chiếu -> deps tưởng không đổi -> tổng cũ
rows.push(1000); // mutate state trực tiếp
const total = useMemo(() => rows.reduce((a, b) => a + b, 0), [rows]); // stale
