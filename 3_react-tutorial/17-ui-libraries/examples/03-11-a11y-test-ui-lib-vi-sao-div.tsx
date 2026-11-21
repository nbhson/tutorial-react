// ĐÚNG: button thật + accessible name rõ -> getByRole query được, keyboard miễn phí
function SaveButton({ onSave }: { onSave: () => void }) {
  // Test khóa: getByRole("button", { name: "Lưu" }) chỉ pass với button thật có text
  return <button type="button" onClick={onSave}>Lưu</button>;
}
// SAI: <div onClick={onSave}>Lưu</div> -> Tab không focus, Enter không bấm, test role không ra
