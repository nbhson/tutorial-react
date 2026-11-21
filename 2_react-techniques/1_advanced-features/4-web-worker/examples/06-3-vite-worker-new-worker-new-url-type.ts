// Cách 1 (khuyên dùng): URL + type module — rõ ràng, type-safe
const w = new Worker(new URL('./calc.worker.ts', import.meta.url), { type: 'module' });

// Cách 2: query ?worker — trả class, new không cần URL
import CalcWorker from './calc.worker?worker';
const w2 = new CalcWorker();
