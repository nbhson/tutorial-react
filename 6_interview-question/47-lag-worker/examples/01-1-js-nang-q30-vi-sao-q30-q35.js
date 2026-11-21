// ❌ (Q30, Q35) — (Q30, Q35) "parse (Q30) "trên main thread (Q30)
function parseFile(text) {
  const result = [];
  for (let i = 0; i < 100000; i++) {
    result.push(heavyComputation(text[i])); // (Q30, Q35) "Nặng (Q30) (Q30)
  }
  return result;
}
// (Q30, Q35) "UI treo (Q30, Q35) (Q30) — "JS (Q30) (Q30, Q35)
