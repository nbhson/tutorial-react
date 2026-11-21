// ToggleLabel trong example.tsx:
type ToggleLabelProps = { isOn: boolean; label?: string };
function ToggleLabel({ isOn, label = "Đèn" }: ToggleLabelProps) {
  return <p className={isOn ? "on" : "off"}>{label}: {isOn ? "BẬT" : "TẮT"}</p>;
}
