// Switch trong example.tsx: event prop với payload boolean đảo
type SwitchProps = { isOn: boolean; onToggle: (next: boolean) => void };
function Switch({ isOn, onToggle }: SwitchProps) {
  return <button onClick={() => onToggle(!isOn)}>{isOn ? "Tắt đi" : "Bật lên"}</button>;
}
// Cha: <Switch isOn={isOn} onToggle={setIsOn} /> — setIsOn nhận boolean mới trực tiếp
