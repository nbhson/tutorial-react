// example.tsx — mirror đầy đủ, khớp từng dòng với file thật
import DOMPurify from 'dompurify';

// Render HTML người dùng nhập — luôn sanitize trước khi đưa vào DOM
// Vì sao phải sanitize: dangerouslySetInnerHTML gán innerHTML thật — không sanitize là script chạy ngay
export function RichText({ html }: { html: string }) {
  // Allowlist tối thiểu: chỉ giữ định dạng cơ bản, bỏ script/iframe/style/on*/srcdoc
  // Vì sao tường minh: mặc định DOMPurify đổi theo version; allowlist riêng giúp review ổn định
  const clean = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'u', 'a', 'p', 'br'],
    ALLOWED_ATTR: ['href'], // chỉ href — bỏ on*, style, srcdoc ngay từ config
  });
  // eslint-disable-next-line react/no-danger — chỉ tắt SAU khi đã sanitize, kèm lý do
  return <div dangerouslySetInnerHTML={{ __html: clean }} />;
}

// Link an toàn: chặn javascript:/data: bằng allowlist protocol (không blacklist)
// Vì sao allowlist: blacklist sót data:/vbscript:/encoding lách; allowlist chỉ cho 3 cái lành
export function SafeLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  let ok = false;
  try {
    // Phân giải URL tương đối theo origin hiện tại để chuẩn hoá (xử lý //evil.com, encoding, khoảng trắng)
    const u = new URL(href, window.location.origin);
    ok = u.protocol === 'https:' || u.protocol === 'http:' || u.protocol === 'mailto:';
  } catch {
    ok = false; // URL hỏng → coi như không an toàn, không làm link
  }
  if (!ok) return <span>{children}</span>; // fallback: chỉ còn chữ, không phải link — an toàn hơn link độc
  return (
    // noopener + noreferrer: trang đích không chạm window.opener (reverse tabnabbing) + không nhận referrer
    <a href={href} rel="noopener noreferrer">
      {children}
    </a>
  );
}
