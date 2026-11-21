// ĐÚNG — 1 lần trong main.tsx
createRoot(document.getElementById("root")!).render(<App />);

// SAI — gọi mỗi khi muốn cập nhật UI
function handleClick() {
  createRoot(document.getElementById("root")!).render(<App />); // ❌ warning + mất state
}
