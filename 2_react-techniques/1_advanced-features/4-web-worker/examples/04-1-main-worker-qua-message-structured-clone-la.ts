// ❌ SAI: truyền function qua postMessage — structured clone ném DataCloneError
worker.postMessage({ fn: () => 1 }); // DataCloneError: () => 1 could not be cloned

// ✅ ĐÚNG: chỉ truyền plain data (object, mảng, string, số)
worker.postMessage({ type: 'sum', payload: [1, 2, 3] });
