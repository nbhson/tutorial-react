// ✅ ĐÚNG: Card không biết theme — Page lắp sẵn CardTitle rồi nhét vào
function Card({ children }: { children: React.ReactNode }) {
  return <section className="card">{children}</section>; // ống vô tri, tái dùng ở đâu cũng được
}
export function Page() {
  return <Card><CardTitle text="Xin chào" /></Card>; // data gắn ở Page, không qua Card
}
