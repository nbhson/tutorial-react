// ✅ ĐÚNG: button + role + aria chuỗi (như Trigger trong ví dụ)
<button role="tab" aria-selected={active ? "true" : "false"} onClick={() => setValue("a")}>A</button>
// Đầy đủ: tablist/tab/tabpanel + aria-controls + keyboard ArrowLeft/Right
