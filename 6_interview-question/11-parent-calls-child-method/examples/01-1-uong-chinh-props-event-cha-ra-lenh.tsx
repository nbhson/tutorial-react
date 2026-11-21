// Cha muốn con focus khi submit lỗi: truyền prop, con tự focus trong effect
function Form() {
  const [error, setError] = useState<string | null>(null);
  return (
    <>
      <EmailInput focusSignal={error} />
      <button onClick={() => setError("Email sai")}>Submit</button>
    </>
  );
}

function EmailInput({ focusSignal }: { focusSignal: string | null }) {
  const inner = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (focusSignal) inner.current?.focus();
  }, [focusSignal]);
  return <input ref={inner} />;
}
