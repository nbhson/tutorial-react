// example.tsx — DAY 1: JSX data display (controlled input)
import { useState } from "react";

type User = { name: string; age: number };

export default function App() {
  const user: User = { name: "Son Nguyen", age: 30 };
  const [name, setName] = useState(user.name);

  return (
    <>
      <h3>Your name: {name}</h3>
      <p>Next year: {user.age + 1}</p>
      <input value={name} onChange={(e) => setName(e.target.value)} />
      <button onClick={() => alert(`Hello ${name}`)}>Click me!</button>
    </>
  );
}
