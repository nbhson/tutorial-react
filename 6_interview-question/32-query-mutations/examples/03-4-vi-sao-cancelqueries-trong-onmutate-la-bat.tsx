// Thiếu dòng này → "nảy" (bẫy):
onMutate: async (id) => {
  // await qc.cancelQueries(...)  ← THẾ NÀY = BUG (request cũ ghi đè)
  ...
}
