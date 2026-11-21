// ❌ SAI: url object/string mới mỗi render (ví dụ `api/${JSON.stringify(f)}`) -> effect chạy mỗi render
useEffect(() => { fetch(`/api/users?f=${JSON.stringify(filter)}`); }, [`/api/users?f=${JSON.stringify(filter)}`]);
