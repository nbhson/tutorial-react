// Ví dụ output "chuẩn" khi AI tuân thủ prompt React 19:
// - function component, ref như prop thường (không forwardRef)
// - default value qua destructuring (không defaultProps)
type Props = {
  label: string;
  disabled?: boolean;
  ref?: React.Ref<HTMLButtonElement>;
};

export function AiButton({ label, disabled = false, ref }: Props) {
  return (
    <button ref={ref} disabled={disabled} className="rounded-lg px-4 py-2">
      {label}
    </button>
  );
}
