// example.tsx — mirror đầy đủ, khớp từng dòng với file thật
import { useId } from 'react';

// Form field accessible: label liên kết id, lỗi báo qua role="alert"
// Vì sao 4 thuộc tính này: label để biết nhập gì, invalid để biết đang lỗi,
// describedby để đọc luôn thông báo, alert để đọc ngay khi xuất hiện
export function EmailField({ error }: { error?: string }) {
  const id = useId(); // id duy nhất, ổn định — tránh trùng khi render nhiều field cùng trang
  const errId = `${id}-err`; // id vùng lỗi để aria-describedby trỏ tới (không trùng field khác)
  return (
    <div>
      <label htmlFor={id}>Email</label> {/* liên kết với input qua id — bấm label là focus input */}
      <input
        id={id}
        type="email" // type đúng để mobile hiện bàn phím @ + validate cơ bản
        autoComplete="email" // giúp autofill + trình đọc màn hình biết đây là email
        aria-invalid={!!error} // báo trạng thái lỗi cho AT (không có là SR không biết đang lỗi)
        aria-describedby={error ? errId : undefined} // liên kết input với thông báo lỗi — focus là đọc lỗi
      />
      {error && (
        // role="alert": live region — xuất hiện là SR đọc ngay, không đợi user Tab tới
        <p id={errId} role="alert" style={{ color: 'red' }}>
          {error} {/* lỗi bằng TEXT (không chỉ màu) — mù màu vẫn biết */}
        </p>
      )}
    </div>
  );
}
