// features/cart/add-to-cart.tsx — ví dụ slice đúng tầng
import { useState } from 'react';

// entities/cart/store.ts (giả lập — thực tế dùng Zustand)
function useAddToCart() {
  const [pending, setPending] = useState(false);
  return {
    pending,
    add: async (id: number) => {
      setPending(true);
      await fetch('/api/cart', {
        method: 'POST',
        body: JSON.stringify({ id }),
      });
      setPending(false);
    },
  };
}

// shared/ui/button.tsx (giả lập)
function Button(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button {...props} />;
}

export function AddToCart({ id }: { id: number }) {
  const { add, pending } = useAddToCart();
  return (
    <Button disabled={pending} onClick={() => add(id)}>
      {pending ? 'Đang thêm…' : 'Thêm vào giỏ'}
    </Button>
  );
}
