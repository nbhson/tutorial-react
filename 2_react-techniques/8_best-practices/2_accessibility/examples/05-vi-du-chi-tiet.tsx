// Icon button — mirror từ README gốc (bổ sung cạnh example.tsx)
// Vì sao aria-label + aria-hidden: nút chỉ icon không có text — SR cần tên; icon trang trí cần ẩn
export function CloseButton({ onClose }: { onClose: () => void }) {
  return (
    <button type="button" aria-label="Đóng menu" onClick={onClose}>
      {/* type="button" để không submit form nhầm khi nằm trong form */}
      <XIcon aria-hidden /> {/* icon trang trí — không cho SR đọc (đọc là nhiễu "graphic X") */}
    </button>
  );
}
