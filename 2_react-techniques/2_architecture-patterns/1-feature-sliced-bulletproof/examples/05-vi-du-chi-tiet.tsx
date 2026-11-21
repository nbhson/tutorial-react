// features/cart/add-to-cart.tsx — ví dụ slice đúng tầng
// Slice nằm ở tầng features → chỉ được dùng entities + shared (không được đọc pages/widgets)
import { useState } from 'react';

// entities/cart/store.ts (giả lập — thực tế dùng Zustand)
// "entity" Cart giữ state nghiệp vụ dùng chung, features/pages cùng đọc
// Vì sao giả lập ở đây: demo một file cho gọn; dự án thật tách entities/cart/store.ts riêng
function useAddToCart() {
  const [pending, setPending] = useState(false); // trạng thái của hành động (đang gửi hay không)
  return {
    pending,
    add: async (id: number) => {
      setPending(true); // bật trạng thái đang gửi → Button disabled, tránh bấm đúp
      await fetch('/api/cart', {
        method: 'POST',
        body: JSON.stringify({ id }), // giao tiếp qua shared/api client (ở đây fetch thẳng cho gọn)
      });
      setPending(false); // xong thì tắt → Button bấm lại được
    },
  };
}

// shared/ui/button.tsx (giả lập) — UI-kit dùng chung mọi tầng
// Vì sao ở shared: Button dùng ở 100 nơi, đổi style 1 chỗ cả app đổi theo; shared không biết feature nào
function Button(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button {...props} />;
}

export function AddToCart({ id }: { id: number }) {
  const { add, pending } = useAddToCart(); // features chỉ dùng entity + shared — đúng chiều import
  return (
    <Button disabled={pending} onClick={() => add(id)}>
      {pending ? 'Đang thêm…' : 'Thêm vào giỏ'}
    </Button>
  );
}
