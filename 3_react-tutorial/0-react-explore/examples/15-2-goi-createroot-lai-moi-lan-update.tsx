// ❌ SAI: gọi render trong event — warning + mất state
function handleClick() {
  createRoot(document.getElementById("root")!).render(<App />); // warning: container has already been created
}
