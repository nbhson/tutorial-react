// ❌ SAI: đường dẫn động hoàn toàn — bundler không tách được, có thể lỗi build
const ten = './HeavyChart';
const mod = await import(ten); // Rollup cảnh báo "dynamic import cannot be analyzed"

// ✅ ĐÚNG: đường dẫn tĩnh để bundler tách chunk
const mod = await import('./HeavyChart');
