// ❌ SAI: import sâu — sửa nội bộ vỡ nơi khác
import { useCartStore } from '@/features/cart/model/store';
// ✅ ĐÚNG: chỉ qua public API
import { AddToCart } from '@/features/cart'; // index.ts quyết định lộ gì
