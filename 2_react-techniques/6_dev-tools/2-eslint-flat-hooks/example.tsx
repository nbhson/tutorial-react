// File này minh họa code SẠCH qua được react-hooks v6 rules:
// - deps đầy đủ, không mutate props, không gọi hook điều kiện.
import { useEffect, useState } from 'react';

export function Greeter({ name }: { name: string }) {
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    // ✅ không mutate props, deps đủ
    setGreeting(`Xin chào, ${name}!`);
  }, [name]);

  return <p>{greeting}</p>;
}
