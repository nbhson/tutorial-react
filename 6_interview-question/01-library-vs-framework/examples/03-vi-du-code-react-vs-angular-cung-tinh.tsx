// React (library): bạn tự ghép mảnh. Không có module nào "bao" giúp.
// Điều hướng? cài react-router. Lấy data? cài @tanstack/react-query.
import { useState } from "react";

export function Counter() {
  const [count, setCount] = useState(0); // state là "mảnh ghép" bạn tự quản
  return <button onClick={() => setCount(count + 1)}>Count: {count}</button>;
}
