// ✅ ĐÚNG: luôn cặp value + onChange, hoặc chuyển uncontrolled có chủ đích
return <input value={name} onChange={(e) => setName(e.target.value)} />;
// Hoặc uncontrolled: <input defaultValue="Son" ref={ref} />
