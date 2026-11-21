import { useForm, Controller } from "react-hook-form";

// Giả sử CitySelect là component UI lib: nhận value + onValueChange, không có ref
function CitySelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">Chọn thành phố</option>
      <option value="hcm">TP.HCM</option>
      <option value="hn">Hà Nội</option>
    </select>
  );
}

function AddressForm() {
  const { control, handleSubmit } = useForm<{ city: string }>({ defaultValues: { city: "" } });
  return (
    <form onSubmit={handleSubmit((d) => alert(d.city))}>
      {/* Controller cắm field của RHF vào đúng prop của UI lib */}
      <Controller name="city" control={control} render={({ field }) => (
        <CitySelect value={field.value} onChange={field.onChange} />
      )} />
      <button type="submit">Lưu</button>
    </form>
  );
}
