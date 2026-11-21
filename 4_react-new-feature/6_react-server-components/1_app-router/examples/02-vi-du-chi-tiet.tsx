// app/products/page.tsx — SERVER COMPONENT (không 'use client')
type Product = { id: string; name: string; price: number };

async function getProducts(): Promise<Product[]> {
  // Chạy trên server: query DB / fetch API nội bộ trực tiếp.
  await new Promise((r) => setTimeout(r, 300)); // giả lập độ trễ DB
  return [
    { id: 'p1', name: 'Bàn phím cơ', price: 1_900_000 },
    { id: 'p2', name: 'Chuột công thái học', price: 900_000 },
  ];
}

// `async function` ngay trong component — đặc quyền của Server Component.
export default async function ShopPage() {
  const products = await getProducts(); // await trực tiếp, không useEffect
  return (
    <div>
      <h2>Shop — Server Component (RSC)</h2>
      <ul>
        {products.map((p) => (
          <li key={p.id}>
            {p.name} — {p.price.toLocaleString('vi-VN')}đ{' '}
            {/* Nhúng Client island vào cây Server — hợp lệ */}
            <AddToCart id={p.id} />
          </li>
        ))}
      </ul>
    </div>
  );
}

// components/AddToCart.tsx — CLIENT ISLAND
// 'use client';
// import { useState } from 'react';
// export function AddToCart({ id }: { id: string }) {
//   const [count, setCount] = useState(0);
//   return <button onClick={() => setCount(count + 1)}>Thêm ({count})</button>;
// }

// Demo self-contained: bản client minh họa island
'use client';
import { useState } from 'react';

export function AddToCart({ id }: { id: string }) {
  const [count, setCount] = useState(0);
  return (
    <button onClick={() => { setCount(count + 1); console.log('add', id); }}>
      Thêm ({count})
    </button>
  );
}
