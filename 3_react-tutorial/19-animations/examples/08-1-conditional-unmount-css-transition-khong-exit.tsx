// ❌ SAI: open false là gỡ ngay — exit không kịp chạy, biến mất đột ngột
{open && <div style={{ transition: "opacity 200ms", opacity: 1 }}>Hi</div>}
