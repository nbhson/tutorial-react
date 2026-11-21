// worker: expose object hàm
import { expose } from 'comlink';
expose({ sum: (xs: number[]) => xs.reduce((a, b) => a + b, 0) });
// main: gọi như hàm async bình thường
import { wrap } from 'comlink';
const calc = wrap<any>(worker);
const tong = await calc.sum([1, 2, 3]); // thực chất là postMessage + chờ reply
