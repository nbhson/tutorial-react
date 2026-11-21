<input value={name} onChange={(e) => setName(e.target.value)} /> // ✅ controlled chuẩn
// <input value={name} />   // ❌ frozen: gõ không được
// <input defaultValue={name} /> // uncontrolled: DOM tự giữ
