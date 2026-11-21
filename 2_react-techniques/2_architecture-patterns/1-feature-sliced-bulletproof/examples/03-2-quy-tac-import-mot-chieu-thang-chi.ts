// ❌ SAI: entities đọc features — ngược tầng, tạo vòng
// entities/product/model.ts
import { useCart } from '@/features/cart'; // entity biết feature → cycle

// ✅ ĐÚNG: features đọc entities — xuôi chiều
// features/cart/ui/AddToCart.tsx
import { useProduct } from '@/entities/product'; // feature dùng entity
// Muốn hai feature chia sẻ → đẩy xuống entities/shared hoặc nâng lên widgets
