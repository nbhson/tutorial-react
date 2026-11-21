// Hai chiều "giả" từ 2 một chiều — TextInput trong example.tsx:
type TextInputProps = { value: string; onValueChange: (next: string) => void };

function TextInput({ value, onValueChange }: TextInputProps) {
  // Con không giữ state — value do cha cho, gõ thì báo cha bằng payload sạch
  return <input value={value} onChange={(e) => onValueChange(e.target.value)} />;
}
// Cha: <TextInput value={name} onValueChange={setName} />
// Gõ "x" -> onValueChange("Sonx") -> setName -> name mới -> value mới chảy xuống
