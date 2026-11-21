// ✅ ĐÚNG: tải editor ngay trong handler, rồi mới mở modal
async function moEditor() {
  // Chunk editor bắt đầu tải khi bấm — trước đó bundle đầu không chứa nó
  const mod = await import('./HeavyEditor');
  setEditor(() => mod.HeavyEditor); // lưu component vào state rồi render
  setMoModal(true);
}
