// Con "nhận" ref của cha và "gắn" vào input DOM:
function Search({ inputRef }: { inputRef: React.Ref<HTMLInputElement> }) {
  return <input ref={inputRef} />;
}
// Cha: const r = useRef<HTMLInputElement>(null); r.current?.focus();
