// ❌ SAI: shared biết features — cycle, build chậm, bug khởi tạo
// shared/ui/Button.tsx
import { useCart } from '@/features/cart';
// ✅ ĐÚNG: features biết shared — xuôi chiều
// features/cart/ui/AddToCart.tsx
import { Button } from '@/shared/ui';
