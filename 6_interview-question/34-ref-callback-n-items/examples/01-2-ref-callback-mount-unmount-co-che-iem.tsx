// callback: "nước" node THẬT vào 1 "cửa" (Map) — React gọi "lúc" node "thật" (gắn/gỡ)
const itemRefs = useRef(new Map<string, HTMLInputElement>());

function InputList({ items }: { items: { id: string; label: string }[] }) {
  const setRef = (id: string) => (node: HTMLInputElement | null) => {
    if (node) itemRefs.current.set(id, node);   // MOUNT (gắn node "thật")
    else itemRefs.current.delete(id);           // UNMOUNT (node "biến mất" → "dọn")
  };

  return (
    <>
      {items.map((it) => (
        <input key={it.id} ref={setRef(it.id)} placeholder={it.label} />
      ))}
    </>
  );
}
// "dùng": itemRefs.current.get("3")?.focus(); (sau render, node "đã" "gắn")
