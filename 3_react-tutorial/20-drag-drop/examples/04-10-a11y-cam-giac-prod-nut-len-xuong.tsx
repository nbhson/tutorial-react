// Nút Lên/Xuống dùng chung hàm move thuần: a11y + test ổn định, không cần giả drag
function MoveButtons({ index, total, onMove }: {
  index: number; total: number; onMove: (from: number, to: number) => void;
}) {
  return (
    <span>
      {/* Disabled ở biên: đầu không lên, cuối không xuống */}
      <button disabled={index === 0} onClick={() => onMove(index, index - 1)}>Lên</button>
      <button disabled={index === total - 1} onClick={() => onMove(index, index + 1)}>Xuống</button>
    </span>
  );
}
