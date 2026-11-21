// ✅ ĐÚNG: khai rõ 3 thứ — tên, cách tải, khi nào sống
import { registerApplication } from 'single-spa';
registerApplication('shop', () => import('shop'), (loc) => loc.pathname.startsWith('/shop'));
