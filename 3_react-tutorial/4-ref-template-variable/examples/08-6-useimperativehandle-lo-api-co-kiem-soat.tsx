// Con chỉ lộ focus + clear, không lộ toàn bộ DOM:
import { useImperativeHandle, useRef } from "react";
function Search({ ref }: { ref?: React.Ref<{ focus: () => void }> }) {
  const inner = useRef<HTMLInputElement>(null);
  useImperativeHandle(ref, () => ({ focus: () => inner.current?.focus() }), []);
  return <input ref={inner} />;
}
