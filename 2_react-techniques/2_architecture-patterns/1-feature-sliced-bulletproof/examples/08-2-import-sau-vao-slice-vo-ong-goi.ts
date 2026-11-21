// ❌ SAI: với tay vào nội bộ — đổi tên file là vỡ
import { store } from '@/features/cart/model/store';
// ✅ ĐÚNG: qua public API
import { AddToCart } from '@/features/cart';
