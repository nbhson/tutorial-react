// Vì sao nói React "chỉ lo view"? Vì core chỉ có thế này:
// - useState: giữ state. Không có HttpClient, không có Router.
import { useState } from "react";

function Counter() {
  // Dữ liệu + UI gộp trong hàm — không có Service/Module bọc ngoài
  const [count, setCount] = useState(0); // mỗi lần setCount -> React vẽ lại <p>
  return <p onClick={() => setCount(count + 1)}>Count: {count}</p>;
}
