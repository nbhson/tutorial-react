function Card({ children }: { children: ReactNode }) {
  return <div className="card">{children}</div>;
}
<Card><p>Nội dung qua children.</p></Card>
