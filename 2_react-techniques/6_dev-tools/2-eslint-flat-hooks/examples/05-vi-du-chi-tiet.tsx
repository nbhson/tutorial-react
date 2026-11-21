// example.tsx — mirror đầy đủ, khớp từng dòng với file thật
// Đoạn code "sạch" qua được react-hooks v6: deps đủ, không mutate, không hook điều kiện
import { useEffect, useState } from 'react';

export function Greeter({ name }: { name: string }) {
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    // ✅ không mutate props (không gán name = ...), deps đủ ([name]) — thiếu là exhaustive-deps đỏ
    // Vì sao effect ở đây: dẫn xuất từ props đồng bộ sau render — deps [name] để đổi tên là cập nhật
    setGreeting(`Xin chào, ${name}!`);
  }, [name]); // deps đủ — bỏ [name] là stale (tên mới mà chào tên cũ)

  return <p>{greeting}</p>;
}
