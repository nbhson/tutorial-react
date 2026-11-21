// Con (Search) chỉ LỘ focus + clear, không lộ toàn bộ input DOM:
import { useImperativeHandle, useRef, useState } from "react";

export type SearchHandle = { focus: () => void; clear: () => void };

function Search({ ref }: { ref?: React.Ref<SearchHandle> }) {
  const inner = useRef<HTMLInputElement>(null);
  const [q, setQ] = useState("");

  useImperativeHandle(
    ref,
    () => ({
      focus: () => inner.current?.focus(),
      clear: () => setQ(""),
    }),
    [] // deps — handle tạo lại khi deps đổi
  );
  return <input ref={inner} value={q} onChange={(e) => setQ(e.target.value)} />;
}

// Cha gọi:
function Parent() {
  const searchRef = useRef<SearchHandle>(null);
  return (
    <>
      <Search ref={searchRef} />
      <button onClick={() => searchRef.current?.focus()}>Tìm</button>
    </>
  );
}
