// hooks/useToggle.ts — PascalCase cho hook, file useX.ts
import { useCallback, useState } from 'react';

export function useToggle(initial = false): [boolean, () => void] {
  const [on, setOn] = useState(initial);
  // useCallback để hàm ổn định (an toàn khi truyền xuống con)
  const toggle = useCallback(() => setOn((v) => !v), []);
  return [on, toggle];
}
