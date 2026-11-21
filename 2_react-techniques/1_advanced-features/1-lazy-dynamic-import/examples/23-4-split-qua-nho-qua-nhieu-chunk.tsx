// ❌ SAI: lazy từng icon 2KB — hàng chục request nhỏ
const IconA = lazy(() => import('./icons/IconA'));
const IconB = lazy(() => import('./icons/IconB'));

// ✅ ĐÚNG: chỉ split route/vendor lớn > 20KB; icon nhỏ giữ import tĩnh
import IconA from './icons/IconA';
import IconB from './icons/IconB';
