// app/layout.tsx — chỉ là server component thường; loading.js KHÔNG đặt ở layout gốc trừ khi muốn loading toàn app
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
