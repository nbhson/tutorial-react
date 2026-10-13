import DOMPurify from 'dompurify';

// Render HTML người dùng nhập — luôn sanitize
export function RichText({ html }: { html: string }) {
  const clean = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'u', 'a', 'p', 'br'],
    ALLOWED_ATTR: ['href'],
  });
  // eslint-disable-next-line react/no-danger
  return <div dangerouslySetInnerHTML={{ __html: clean }} />;
}

// Link an toàn: chặn javascript: URLs
export function SafeLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  let ok = false;
  try {
    const u = new URL(href, window.location.origin);
    ok = u.protocol === 'https:' || u.protocol === 'http:' || u.protocol === 'mailto:';
  } catch {
    ok = false;
  }
  if (!ok) return <span>{children}</span>;
  return (
    <a href={href} rel="noopener noreferrer">
      {children}
    </a>
  );
}
