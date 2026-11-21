function Modal({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  const panelRef = useRef<HTMLDivElement>(null);
  const prevFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    prevFocus.current = document.activeElement as HTMLElement;
    panelRef.current?.focus(); // đưa focus vào modal khi mở
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      prevFocus.current?.focus(); // trả focus về nút đã mở modal
    };
  }, [onClose]);

  return (
    <div role="dialog" aria-modal="true" aria-label="Xác nhận xóa">
      <div ref={panelRef} tabIndex={-1}>{children}</div>
      <button onClick={onClose}>Đóng</button>
    </div>
  );
}
