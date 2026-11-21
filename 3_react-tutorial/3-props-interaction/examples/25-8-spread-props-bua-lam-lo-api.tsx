// ✅ ĐÚNG: destructure thứ cần, spread phần còn lại có chủ đích
function Btn({ onAdd, ...rest }: { onAdd: () => void } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button {...rest} onClick={onAdd}>Hi</button>;
}
