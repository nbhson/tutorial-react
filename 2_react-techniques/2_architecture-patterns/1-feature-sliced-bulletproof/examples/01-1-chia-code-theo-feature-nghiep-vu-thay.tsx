// ❌ SAI: folder by type — AddToCart rải 4 nơi, không biết thuộc về ai
// components/AddToCart.tsx + hooks/useCart.ts + api/cart.ts + utils/cartHelper.ts
// Sửa giá phải mở 4 thư mục, xóa tính năng sợ sót file

// ✅ ĐÚNG: folder by feature — mọi thứ của cart một chỗ
// features/cart/{ui/AddToCart.tsx, model/useAddToCart.ts, api/cartApi.ts, index.ts}
