// AiButton.tsx — ref là prop thường từ React 19, không forwardRef
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
